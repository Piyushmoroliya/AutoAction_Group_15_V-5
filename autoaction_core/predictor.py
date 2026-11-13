"""
autoaction_core/predictor.py
============================
Clean production API wrapping AutoAction's validation-calibrated ensemble:
  M1: ResNet18 (seed 777)
  M2: 3-View CLIP ViT-B/32 LogisticRegression (train-fit)
  M3: Train-only OCR TF-IDF Calibrated Text Classifier (models/text_classifier.joblib)
  M4: Concatenated 3-View CLIP + Train-Only OCR TF-IDF LogisticRegression
With Temperature Scaling, Field Extraction, and Safety Gate.
"""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import torch
from PIL import Image
from scipy.sparse import csr_matrix, hstack

import cnn.config as cfg
from autoaction_core.features import (
    CLIP_WEIGHTS_PATH,
    PROJECT_ROOT,
    pil_to_3_views,
    resize_long_side_256,
)
from cnn.dataset import get_transforms
from cnn.model import load_model
from nlp.date_parser import extract_dates
from nlp.field_extractor import extract_field_evidence, extract_fields, validate_required_fields
from nlp.text_classifier import OCRTextClassifier
from ocr.cleaner import clean_ocr_text
from ocr.extractor import extract_text_with_boxes
from ocr.social_parser import detect_social_post, parse_social_post_screenshot
from ocr.whatsapp_parser import (
    detect_screenshot_source,
    infer_whatsapp_message_intent,
    parse_whatsapp_screenshot,
)

CLASSES: list[str] = list(cfg.CLASSES)
DEFAULT_CONFIG_PATH = PROJECT_ROOT / "models" / "final_ensemble_config.json"


def apply_temperature_scaling(probs: np.ndarray, temperature: float) -> np.ndarray:
    """Applies temperature scaling to a probability matrix (N, C) or vector (C,)."""
    t = max(float(temperature), 1e-4)
    p = np.clip(probs, 1e-12, 1.0)
    logits = np.log(p) / t
    logits = logits - np.max(logits, axis=-1, keepdims=True)
    exp_l = np.exp(logits)
    return exp_l / np.sum(exp_l, axis=-1, keepdims=True)


class AutoActionPredictor:
    """Thread-safe lazy loader & inference wrapper for AutoAction's ensemble."""

    def __init__(self, config_path: Path | str | None = None, num_threads: int = 4) -> None:
        torch.set_num_threads(num_threads)
        self.config_path = Path(config_path) if config_path else DEFAULT_CONFIG_PATH
        if not self.config_path.exists():
            raise FileNotFoundError(f"Ensemble config not found: {self.config_path}")
        self.cfg = json.loads(self.config_path.read_text(encoding="utf-8"))

        self.cnn_transform = get_transforms("test")
        self.m1_model = load_model(
            PROJECT_ROOT / self.cfg["m1_checkpoint"],
            class_names=CLASSES,
            num_classes=len(CLASSES),
            device=torch.device("cpu"),
        )
        self.m1_model.eval()

        import open_clip
        self.clip_model, _, self.clip_preprocess = open_clip.create_model_and_transforms(
            "ViT-B-32",
            pretrained=str(CLIP_WEIGHTS_PATH),
            device="cpu",
        )
        self.clip_model.eval()

        self.m2_clf = joblib.load(PROJECT_ROOT / self.cfg["m2_model_path"])
        self.m3_clf = OCRTextClassifier(PROJECT_ROOT / self.cfg["m3_model_path"])
        m4_bundle = joblib.load(PROJECT_ROOT / self.cfg["m4_model_path"])
        self.m4_tfidf = m4_bundle["tfidf"]
        self.m4_clf = m4_bundle["clf"]

    def predict_probs_from_inputs(self, image_path: Path, cleaned_text: str) -> dict[str, Any]:
        """Returns calibrated probabilities and per-model breakdown for a single screenshot."""
        with Image.open(image_path) as im:
            rgb_256 = resize_long_side_256(im, max_side=256)
            v_full, v_top, v_bot = pil_to_3_views(rgb_256)

        # M1: ResNet18 on 256px RGB matching cached training/val eval
        x_cnn = self.cnn_transform(rgb_256).unsqueeze(0)
        with torch.no_grad():
            p1 = torch.softmax(self.m1_model(x_cnn), dim=-1).cpu().numpy()[0]

        # CLIP 3-view (1536-d)
        x_clip_views = torch.stack(
            [self.clip_preprocess(v_full), self.clip_preprocess(v_top), self.clip_preprocess(v_bot)],
            dim=0,
        )
        with torch.no_grad():
            emb = self.clip_model.encode_image(x_clip_views)
            emb = emb / emb.norm(dim=-1, keepdim=True).clamp(min=1e-12)
            emb_1536 = emb.reshape(1, -1)
            emb_1536 = emb_1536 / emb_1536.norm(dim=-1, keepdim=True).clamp(min=1e-12)
            clip_vec = emb_1536.cpu().numpy().astype(np.float32)

        # M2: CLIP-LR
        p2 = self.m2_clf.predict_proba(clip_vec)[0]

        # M3: OCR Text Classifier
        txt_for_clf = cleaned_text.strip() if len(cleaned_text.strip()) >= 3 else "empty document non text"
        p3_dict = self.m3_clf.predict_proba(txt_for_clf)
        p3 = np.array([p3_dict.get(c, 0.0) for c in CLASSES], dtype=np.float64)

        # M4: CLIP + OCR-TFIDF concatenated LR
        x_tf = self.m4_tfidf.transform([txt_for_clf])
        x_m4 = hstack([csr_matrix(clip_vec), x_tf], format="csr")
        p4 = self.m4_clf.predict_proba(x_m4)[0]

        w = np.array(self.cfg["weights"], dtype=np.float64)
        p_ens = w[0] * p1 + w[1] * p2 + w[2] * p3 + w[3] * p4
        p_ens = p_ens / max(float(np.sum(p_ens)), 1e-12)
        p_cal = apply_temperature_scaling(p_ens, self.cfg["temperature"])

        return {
            "p_cal": p_cal,
            "p_ens": p_ens,
            "p1": p1,
            "p2": p2,
            "p3": p3,
            "p4": p4,
        }

    def predict(
        self,
        image_path: str | Path,
        *,
        preextracted_text: str | None = None,
        reference_date: date | None = None,
    ) -> dict[str, Any]:
        """
        Runs full source-aware prediction + message parsing + field extraction +
        READY / ASK_USER / NO_ACTION safety gating with non-mutating action preview.
        """
        p = Path(image_path)
        if not p.exists():
            raise FileNotFoundError(f"Image not found: {p}")

        boxes: list[dict] = []
        if preextracted_text is None:
            try:
                raw_text, boxes = extract_text_with_boxes(p, engine="auto", clean=False)
            except Exception:
                raw_text, boxes = "", []
            cleaned_text = clean_ocr_text(raw_text)
        else:
            raw_text = preextracted_text
            cleaned_text = preextracted_text

        source_type = detect_screenshot_source(raw_text or cleaned_text, boxes=boxes, filename=p.name)
        wa_info: dict[str, Any] | None = None
        social_info: dict[str, Any] | None = None
        analysis_text = cleaned_text
        actionable_messages: list[dict[str, Any]] = []
        bold_poster_title: str | None = None

        if source_type == "whatsapp":
            wa_info = parse_whatsapp_screenshot(cleaned_text, boxes=boxes)
            msgs = wa_info.get("messages") or []
            if msgs:
                # Score each WhatsApp message bubble independently so unrelated bubbles don't merge
                scored_msgs: list[tuple[int, dict[str, Any], dict[str, Any]]] = []
                for idx, m in enumerate(msgs):
                    m_txt = (m.get("text") or "").strip()
                    if not m_txt:
                        continue
                    m_intent = infer_whatsapp_message_intent(m_txt)
                    scored_msgs.append((idx, m, m_intent))
                    if m_intent["category"] != "other" or m_intent["score"] >= 1.0:
                        actionable_messages.append({
                            "message_id": m.get("message_id", f"msg_{idx + 1}"),
                            "sender": m.get("sender"),
                            "time": m.get("time"),
                            "text": m_txt,
                            "category": m_intent["category"],
                            "intent": m_intent["intent"],
                            "score": m_intent["score"],
                            "cues": m_intent.get("evidence", []),
                        })

                if actionable_messages:
                    # Select highest-scoring actionable message; merge adjacent same-sender continuation
                    best_idx, best_m, best_intent = max(
                        scored_msgs,
                        key=lambda item: (item[2]["score"], 1 if item[2]["category"] != "other" else 0, len(item[1].get("text", ""))),
                    )
                    best_sender = (best_m.get("sender") or "").strip().lower()
                    selected_parts = [best_m.get("text", "").strip()]
                    for idx, m, m_intent in scored_msgs:
                        if idx == best_idx:
                            continue
                        m_sender = (m.get("sender") or "").strip().lower()
                        same_sender = bool(best_sender and m_sender == best_sender) or (not m_sender and abs(idx - best_idx) == 1)
                        compatible_cat = m_intent["category"] in (best_intent["category"], "other")
                        if same_sender and compatible_cat and abs(idx - best_idx) <= 1:
                            selected_parts.append(m.get("text", "").strip())
                    analysis_text = "\n".join(part for part in selected_parts if part)
                elif wa_info.get("clean_message_text"):
                    analysis_text = wa_info["clean_message_text"]
            elif wa_info.get("clean_message_text"):
                analysis_text = wa_info["clean_message_text"]
        elif detect_social_post(raw_text or cleaned_text, boxes=boxes):
            source_type = "social_post"
            social_info = parse_social_post_screenshot(cleaned_text, boxes=boxes)
            if social_info.get("clean_text"):
                analysis_text = social_info["clean_text"]
            bold_poster_title = social_info.get("bold_poster_title")

        probs = self.predict_probs_from_inputs(p, analysis_text)
        p_cal = probs["p_cal"]
        p3_txt = probs["p3"]

        # WhatsApp is a source layout, not a semantic category:
        # classify from message content + M3 text classifier + intent cues.
        wa_intent_info = None
        if source_type == "whatsapp":
            wa_intent_info = infer_whatsapp_message_intent(analysis_text)
            # Blend text classifier (M3) heavily on clean message text + intent cues
            m3_top_idx = int(np.argmax(p3_txt))
            m3_top_cat = CLASSES[m3_top_idx]
            m3_top_conf = float(p3_txt[m3_top_idx])

            if wa_intent_info["score"] >= 1.5 and wa_intent_info["category"] != "other":
                top_cat = wa_intent_info["category"]
                # Calibrate confidence from message intent strength + M3 agreement
                top_conf = min(0.95, round(0.55 + 0.12 * wa_intent_info["score"] + (0.15 if m3_top_cat == top_cat else 0.0), 4))
            elif m3_top_conf >= 0.50:
                top_cat = m3_top_cat
                top_conf = round(m3_top_conf, 4)
            elif wa_intent_info["category"] == "other":
                top_cat = "other"
                top_conf = max(0.55, round(float(p_cal[CLASSES.index("other")]) if "other" in CLASSES else 0.55, 4))
            else:
                top_idx = int(np.argmax(p_cal))
                top_cat = CLASSES[top_idx]
                top_conf = float(p_cal[top_idx])
        else:
            top_idx = int(np.argmax(p_cal))
            top_cat = CLASSES[top_idx]
            top_conf = float(p_cal[top_idx])

        cfg_ref_date: date | None = None
        if self.cfg.get("reference_date"):
            try:
                cfg_ref_date = date.fromisoformat(str(self.cfg["reference_date"])[:10])
            except ValueError:
                cfg_ref_date = None

        effective_ref_date = reference_date or cfg_ref_date
        if effective_ref_date is None and wa_info:
            for div in wa_info.get("chat_date_dividers") or []:
                div_hits = extract_dates(div)
                explicit_div = [d for d in div_hits if not d.get("relative")]
                if explicit_div:
                    try:
                        effective_ref_date = date.fromisoformat(explicit_div[0]["iso"])
                        break
                    except ValueError:
                        pass

        evidence = extract_field_evidence(analysis_text, reference_date=effective_ref_date)
        reject_thresh = float(self.cfg["reject_threshold"])
        action_thresh = float(self.cfg.get("action_threshold", reject_thresh))
        fields = extract_fields(
            analysis_text,
            category=top_cat,
            reference_date=effective_ref_date,
            bold_poster_title=bold_poster_title,
        )

        # Distinguish anchored/explicit dates from unanchored relative dates ("today"/"tomorrow" without message date)
        date_hits = extract_dates(analysis_text, reference_date=effective_ref_date)
        if date_hits:
            fields["date_evidence"] = date_hits[0].get("raw")
            fields["date_resolution"] = "relative" if date_hits[0].get("relative") else "explicit"
        if effective_ref_date is None and date_hits and all(d.get("relative") for d in date_hits):
            if top_cat in {"assignment", "event", "notice", "examination", "payment"}:
                fields["date_uncertain"] = True
                fields["date_uncertainty_reason"] = (
                    f"Relative date ('{date_hits[0]['raw']}') has no message date or chat date divider; please confirm the exact date."
                )
                v_ok, v_reasons = validate_required_fields(top_cat, fields)
                fields["field_validation"] = {"valid": v_ok, "reasons": v_reasons}
                fields["validation_status"] = "ok" if v_ok else "ask_user"

        gate = fields.get("field_validation") or {"valid": True, "reasons": []}

        # Past-date sanity check for reminder-creating categories (never payment or academic_material)
        past_check_ref = reference_date or cfg_ref_date
        date_warning = self._check_past_date_warning(top_cat, fields, past_check_ref)
        if date_warning:
            fields["date_warning"] = date_warning

        # Separated validation states & explicit READY / ASK_USER / NO_ACTION outcome
        category_validated = top_conf >= reject_thresh
        fields_validated = bool(gate.get("valid", True)) if top_cat != "other" else True

        if not category_validated:
            decision = "ASK_USER"
            status = "ask_user"
            action_ready = False
            reason = (
                f"I'm not certain whether this is '{top_cat}' (confidence {top_conf:.0%} < {reject_thresh:.0%}). "
                f"Please confirm the category before I proceed."
            )
        elif top_cat == "other":
            decision = "NO_ACTION"
            status = "ok"
            action_ready = False
            reason = f"No actionable intent detected ('other', conf={top_conf:.4f}). No action needed."
        elif not fields_validated:
            decision = "ASK_USER"
            status = "ask_user"
            action_ready = False
            reason = self._build_ask_user_prompt(top_cat, fields, gate.get("reasons", []))
        elif top_conf < action_thresh:
            decision = "ASK_USER"
            status = "ask_user"
            action_ready = False
            reason = (
                f"Detected '{top_cat}' (confidence {top_conf:.0%}), which is below the action safety threshold "
                f"({action_thresh:.0%}). Please confirm before executing."
            )
        elif date_warning:
            decision = "ASK_USER"
            status = "ask_user"
            action_ready = False
            reason = f"Past date detected: {date_warning}"
        else:
            decision = "READY"
            status = "ok"
            action_ready = True
            ev_note = f"; field_evidence={list(evidence)}" if top_cat in evidence else ""
            warn_note = f" Note: {date_warning}" if date_warning else ""
            reason = f"Accepted '{top_cat}' (conf={top_conf:.4f} >= {action_thresh:.2f}, fields valid{ev_note}).{warn_note}"

        user_confirmation_required = bool(action_ready)
        action_executed = False

        editable_fields = self._build_editable_fields(top_cat, fields, gate.get("reasons", []))
        proposed_action = self._build_action_preview(top_cat, fields, p.name) if action_ready else {
            "action_type": "NONE",
            "summary": reason if decision == "ASK_USER" else "No actionable intent.",
            "requires_confirmation": False,
            "payload": None,
        }
        proposed_action["editable_fields"] = editable_fields
        if date_warning:
            proposed_action["warnings"] = [date_warning]

        return {
            "category": top_cat,
            "confidence": round(top_conf, 4),
            "status": status,
            "decision": decision,
            "reason": reason,
            "source_type": source_type,
            "reference_date": (past_check_ref or date.today()).isoformat(),
            "is_demo_date": bool(past_check_ref),
            "intent": wa_intent_info["intent"] if wa_intent_info else (
                "no_action" if top_cat == "other" else f"handle_{top_cat}"
            ),
            "pipeline_completed": True,
            "category_validated": category_validated,
            "fields_validated": fields_validated,
            "action_ready": action_ready,
            "user_confirmation_required": user_confirmation_required,
            "action_executed": action_executed,
            "proposed_action": proposed_action,
            "messages": wa_info["messages"] if wa_info else [],
            "actionable_messages": actionable_messages,
            "fields": fields,
            "extracted_text": analysis_text,
        }

    @staticmethod
    def _check_past_date_warning(
        category: str,
        fields: dict[str, Any],
        reference_date: date | None,
    ) -> str | None:
        if category not in {"assignment", "event", "notice", "examination"}:
            return None
        d_str = fields.get("deadline") or fields.get("date")
        if not d_str or not isinstance(d_str, str):
            return None
        try:
            parsed_d = date.fromisoformat(d_str[:10])
        except ValueError:
            return None
        ref = reference_date or date.today()
        if parsed_d < ref:
            return f"Date {parsed_d.isoformat()} appears to be in the past (relative to {ref.isoformat()}); verify before scheduling."
        return None

    @staticmethod
    def _build_ask_user_prompt(
        category: str,
        fields: dict[str, Any],
        reasons: list[str],
    ) -> str:
        r_set = set(reasons)
        if "unanchored_relative_date" in r_set and fields.get("date_uncertainty_reason"):
            return fields["date_uncertainty_reason"]
        if category == "payment":
            if {"missing_amount", "missing_or_invalid_amount"} & r_set:
                return "I detected a payment reminder/receipt, but the amount is not visible. What amount should I record?"
            return "I detected a payment screenshot, but key details are unclear. Please confirm the amount and recipient."
        if category == "assignment":
            missing_dl = "missing_deadline" in r_set
            missing_title = "missing_title_and_subject" in r_set
            label = fields.get("subject") or fields.get("title")
            dl = fields.get("deadline_formatted") or fields.get("deadline")
            if missing_dl and not missing_title and label:
                return f"I detected an assignment ('{label}'), but the submission deadline is missing. What is the due date?"
            if missing_title and not missing_dl and dl:
                return f"I detected an assignment due {dl}, but the subject or task title is unclear. What should I name it?"
            return "I detected an assignment, but both the task title/subject and deadline are unclear. Please provide them."
        if category == "examination":
            if "missing_exam_rows_and_date" in r_set or "missing_exam_date" in r_set:
                return "I detected an examination notice, but the exam date or subject rows are unclear. Which exam and date should I schedule?"
            return "I detected an examination screenshot, but the subject details are incomplete. Please confirm the exam details."
        if category == "event":
            missing_dt = "missing_date" in r_set
            missing_nm = "missing_event_name" in r_set
            ev = fields.get("event_name")
            dt = fields.get("date")
            if missing_dt and not missing_nm and ev:
                return f"I detected an event ('{ev}'), but the event date is unclear. What date should I add?"
            if missing_nm and not missing_dt and dt:
                return f"I detected an event on {dt}, but the event name is unclear. What is the event called?"
            return "I detected an event, but the event name and date are unclear. Please confirm before adding to your calendar."
        if category == "notice":
            missing_subj = "missing_subject" in r_set
            missing_dt = "missing_date_and_time" in r_set
            subj = fields.get("subject")
            dt = fields.get("date") or fields.get("time")
            if missing_dt and not missing_subj and subj:
                return f"I detected a notice ('{subj}'), but no date or time is specified. When should I remind you?"
            if missing_subj and not missing_dt and dt:
                return f"I detected a notice for {dt}, but the notice topic is unclear. What should the reminder say?"
            return "I detected a notice, but the topic and date/time are unclear. Please clarify what reminder to set."
        if category == "academic_material":
            return "I detected study material, but the subject and topic are unclear. What topic should I file this under?"
        if "unanchored_relative_date" in r_set and fields.get("date_uncertainty_reason"):
            return fields["date_uncertainty_reason"]
        return f"Some required details for '{category}' are unclear ({', '.join(reasons)}). Please confirm before proceeding."

    @staticmethod
    def _build_editable_fields(
        category: str,
        fields: dict[str, Any],
        reasons: list[str],
    ) -> dict[str, dict[str, Any]]:
        """Builds UI-editable field descriptors with uncertainty reasons and source evidence."""
        if category == "other":
            return {}
        details = fields.get("field_details") or {}
        r_set = set(reasons)

        def _entry(key: str, val: Any, uncertain: bool = False, reason: str | None = None) -> dict[str, Any]:
            det = details.get(key) or {}
            return {
                "value": val,
                "uncertain": bool(uncertain),
                "uncertainty_reason": reason,
                "source_evidence": det.get("source_evidence"),
                "editable": True,
            }

        title_val = fields.get("event_name") if category == "event" else (fields.get("title") or fields.get("topic"))
        subj_val = fields.get("subject")
        date_val = fields.get("deadline") or fields.get("date")
        time_val = fields.get("time_12") or fields.get("time")
        amt_val = fields.get("amount")
        venue_val = fields.get("venue") or fields.get("room") or fields.get("platform")

        return {
            "title": _entry(
                "event_name" if category == "event" else "title",
                title_val,
                uncertain=any("title" in r or "event_name" in r or "topic" in r for r in r_set),
                reason=next((r for r in reasons if "title" in r or "event_name" in r or "topic" in r), None),
            ),
            "subject": _entry(
                "subject",
                subj_val,
                uncertain=any("subject" in r or "exam_row" in r for r in r_set),
                reason=next((r for r in reasons if "subject" in r or "exam_row" in r), None),
            ),
            "date": _entry(
                "date" if "date" in details else "deadline",
                date_val,
                uncertain=bool(fields.get("date_uncertain")) or any("date" in r or "deadline" in r for r in r_set),
                reason=fields.get("date_uncertainty_reason") or fields.get("date_warning") or next((r for r in reasons if "date" in r or "deadline" in r), None),
            ),
            "time": _entry("time", time_val),
            "amount": _entry(
                "amount",
                amt_val,
                uncertain=bool(fields.get("amount_uncertain")) or any("amount" in r for r in r_set),
                reason=next((r for r in reasons if "amount" in r), None),
            ),
            "venue": _entry("venue" if "venue" in details else "room", venue_val),
        }

    @staticmethod
    def _build_action_preview(category: str, fields: dict[str, Any], source_image: str) -> dict[str, Any]:
        from actions.executor import ActionExecutor
        # Build non-mutating preview without triggering DB side effects
        cat = category.lower().strip()
        if cat == "payment":
            return {
                "action_type": "ADD_EXPENSE",
                "summary": f"Log Rs{fields.get('amount')} expense to {fields.get('merchant') or 'Merchant'} on {fields.get('date')}",
                "requires_confirmation": True,
                "payload": {"category": cat, "fields": fields, "source_image": source_image},
            }
        if cat == "assignment":
            return {
                "action_type": "CREATE_TASK+CREATE_REMINDER",
                "summary": f"Create assignment task '{fields.get('subject')}: {fields.get('title')}' due {fields.get('deadline_formatted') or fields.get('deadline')}",
                "requires_confirmation": True,
                "payload": {"category": cat, "fields": fields, "source_image": source_image},
            }
        if cat == "event":
            return {
                "action_type": "CALENDAR+CREATE_REMINDER",
                "summary": f"Add event '{fields.get('event_name')}' on {fields.get('date')} at {fields.get('venue') or 'TBD'}",
                "requires_confirmation": True,
                "payload": {"category": cat, "fields": fields, "source_image": source_image},
            }
        if cat == "notice":
            return {
                "action_type": "CREATE_REMINDER+CALENDAR",
                "summary": f"Remind '{fields.get('subject')}' on {fields.get('date') or fields.get('time')}",
                "requires_confirmation": True,
                "payload": {"category": cat, "fields": fields, "source_image": source_image},
            }
        if cat == "examination":
            return {
                "action_type": "CREATE_REMINDER+CALENDAR",
                "summary": f"Schedule exam reminder(s) for '{fields.get('subject')}' ({fields.get('date')})",
                "requires_confirmation": True,
                "payload": {"category": cat, "fields": fields, "source_image": source_image},
            }
        if cat == "academic_material":
            return {
                "action_type": "ADD_TO_ACADEMIC_MEMORY",
                "summary": f"Save notes '{fields.get('subject') or 'Study'}: {fields.get('topic')}'",
                "requires_confirmation": True,
                "payload": {"category": cat, "fields": fields, "source_image": source_image},
            }
        return {"action_type": "NONE", "summary": "No action.", "requires_confirmation": False, "payload": None}


_DEFAULT_PREDICTOR: AutoActionPredictor | None = None


def predict(
    image_path: str | Path,
    *,
    reference_date: date | None = None,
    config_path: Path | str | None = None,
) -> dict[str, Any]:
    """
    Top-level clean wrapper:
        autoaction_core.predict(image_path) -> {category, confidence, status, reason, fields, extracted_text}
    """
    global _DEFAULT_PREDICTOR
    if _DEFAULT_PREDICTOR is None or config_path is not None:
        pred = AutoActionPredictor(config_path=config_path)
        if config_path is None:
            _DEFAULT_PREDICTOR = pred
        return pred.predict(image_path, reference_date=reference_date)
    return _DEFAULT_PREDICTOR.predict(image_path, reference_date=reference_date)
