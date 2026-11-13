import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import SearchInput from '../../components/common/SearchInput';
import { Wallet, Plus, Trash2, TrendingUp, PieChart, RefreshCw } from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../../constants/categories';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/common/Dialog';
import Input from '../../components/common/Input';
import { toast } from 'sonner';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { expensesService, type Expense, type ExpenseCreate } from '../../services/expenses';

const COLORS = ['#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#06b6d4', '#84cc16'];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    amount: '',
    merchant: '',
    category: EXPENSE_CATEGORIES.FOOD,
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setIsLoading(true);
      const data = await expensesService.listExpenses();
      setExpenses(data);
    } catch (error: any) {
      console.error('Failed to load expenses:', error);
      toast.error(error.response?.data?.detail || 'Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.merchant && expense.merchant.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const currentMonthExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.transaction_date || expense.created_at);
    const now = new Date();
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
  });

  const totalSpending = currentMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const categoryData = Object.values(EXPENSE_CATEGORIES).map((category) => ({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    value: currentMonthExpenses.filter((e) => e.category === category).reduce((sum, e) => sum + Number(e.amount), 0),
  })).filter((item) => item.value > 0);

  const handleAdd = async () => {
    if (!formData.amount || !formData.merchant) {
      toast.error('Amount and merchant are required');
      return;
    }

    try {
      const data: ExpenseCreate = {
        amount: parseFloat(formData.amount),
        merchant: formData.merchant,
        category: formData.category,
        transaction_date: new Date(formData.date).toISOString(),
      };

      await expensesService.createExpense(data);
      toast.success('Expense added successfully');
      setShowAddDialog(false);
      setFormData({ amount: '', merchant: '', category: EXPENSE_CATEGORIES.FOOD, date: format(new Date(), 'yyyy-MM-dd') });
      loadExpenses();
    } catch (error: any) {
      console.error('Add failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to add expense');
    }
  };

  const handleDelete = (id: number) => {
    setExpenseToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (expenseToDelete) {
      try {
        await expensesService.deleteExpense(expenseToDelete);
        toast.success('Expense deleted successfully');
        setShowDeleteDialog(false);
        setExpenseToDelete(null);
        loadExpenses();
      } catch (error: any) {
        console.error('Delete failed:', error);
        toast.error(error.response?.data?.detail || 'Failed to delete expense');
      }
    }
  };

  const getCategoryLabel = (category?: string) => {
    if (!category) return 'N/A';
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 text-navy-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 dark:text-white">
            Expense Intelligence
          </h1>
          <p className="text-navy-500 dark:text-navy-400 mt-1">
            Track and analyze your spending
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadExpenses}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-navy-500 dark:text-navy-400">
              Total Spending (This Month)
            </CardTitle>
            <Wallet className="h-4 w-4 text-navy-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-navy-900 dark:text-white">
              ₹{totalSpending.toLocaleString()}
            </div>
            <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
              {currentMonthExpenses.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-navy-500 dark:text-navy-400">
              Average Transaction
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-navy-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-navy-900 dark:text-white">
              ₹{currentMonthExpenses.length > 0 ? Math.round(totalSpending / currentMonthExpenses.length).toLocaleString() : '0'}
            </div>
            <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
              Per transaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-navy-500 dark:text-navy-400">
              Top Category
            </CardTitle>
            <PieChart className="h-4 w-4 text-navy-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-navy-900 dark:text-white">
              {categoryData.length > 0 ? categoryData.reduce((max, item) => item.value > max.value ? item : max).name : 'N/A'}
            </div>
            <p className="text-xs text-navy-500 dark:text-navy-400 mt-1">
              Highest spending category
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ₹${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value}`} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-navy-500 dark:text-navy-400">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${value}`} />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-navy-500 dark:text-navy-400">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Search by merchant..."
                value={searchQuery}
                onSearch={setSearchQuery}
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-navy-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-navy-600 dark:bg-navy-800 dark:text-white"
            >
              <option value="all">All Categories</option>
              {Object.values(EXPENSE_CATEGORIES).map((cat) => (
                <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      {filteredExpenses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Wallet className="h-12 w-12 mx-auto text-navy-400 mb-4" />
            <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-2">
              No expenses found
            </h3>
            <p className="text-navy-500 dark:text-navy-400 mb-4">
              {searchQuery || categoryFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Start by adding your first expense'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-navy-200 dark:divide-navy-700">
              {filteredExpenses.map((expense) => (
                <div key={expense.id} className="p-4 hover:bg-navy-50 dark:hover:bg-navy-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          <Wallet className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-navy-900 dark:text-white">{expense.merchant || 'Unknown'}</h3>
                          <p className="text-sm text-navy-500 dark:text-navy-400">
                            {format(new Date(expense.transaction_date || expense.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-navy-900 dark:text-white">₹{Number(expense.amount).toLocaleString()}</p>
                        <Badge variant="info">{getCategoryLabel(expense.category)}</Badge>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(expense.id)}>
                        <Trash2 className="h-4 w-4 text-error-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Expense Dialog */}
      <Dialog isOpen={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                Amount *
              </label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                Merchant *
              </label>
              <Input
                value={formData.merchant}
                onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                placeholder="Merchant name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border border-navy-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-navy-600 dark:bg-navy-800 dark:text-white"
              >
                {Object.values(EXPENSE_CATEGORIES).map((cat) => (
                  <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-1">
                Date
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>
              Add Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog isOpen={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Expense</DialogTitle>
          </DialogHeader>
          <p className="text-navy-600 dark:text-navy-400">
            Are you sure you want to delete this expense? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
