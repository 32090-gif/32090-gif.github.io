import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, Edit, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  productCount: number;
}

const CategoriesManager = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: '📦'
  });

  const defaultCategories: Category[] = [
    {
      id: 'topup',
      name: 'บัตรเติมเงิน',
      description: 'บัตรเติมเงินสำหรับเกมต่างๆ',
      color: '#3B82F6',
      icon: '💳',
      productCount: 0
    },
    {
      id: 'games',
      name: 'ไอดีเกม',
      description: 'ไอดีเกมและคีย์ดิจิทัล',
      color: '#10B981',
      icon: '🎮',
      productCount: 0
    },
    {
      id: 'items',
      name: 'ไอเทมในเกม',
      description: 'ไอเทมและสกินในเกม',
      color: '#F59E0B',
      icon: '⚔️',
      productCount: 0
    },
    {
      id: 'apps',
      name: 'แอปพลิเคชัน',
      description: 'แอปพลิเคชันและซอฟต์แวร์',
      color: '#8B5CF6',
      icon: '📱',
      productCount: 0
    },
    {
      id: 'services',
      name: 'บริการพิเศษ',
      description: 'บริการพิเศษต่างๆ',
      color: '#EF4444',
      icon: '⭐',
      productCount: 0
    }
  ];

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      // ในอนาคติจะดึงจาก API
      // const response = await fetch('/api/categories');
      // const data = await response.json();
      // setCategories(data.categories);
      
      // ชั่วคราวใช้ข้อมูลตัวอย่าง
      setCategories(defaultCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories(defaultCategories);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.products) {
          setProducts(data.products);
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    updateProductCounts();
  }, [products]);

  const updateProductCounts = () => {
    const updatedCategories = categories.map(category => ({
      ...category,
      productCount: products.filter(product => product.category === category.name).length
    }));
    setCategories(updatedCategories);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('กรุณากรอกชื่อหมวดหมู่');
      return;
    }

    try {
      if (editingCategory) {
        // แก้ไขหมวดหมู่
        const updatedCategories = categories.map(cat =>
          cat.id === editingCategory.id
            ? { ...cat, ...formData }
            : cat
        );
        setCategories(updatedCategories);
        toast.success('แก้ไขหมวดหมู่สำเร็จ');
      } else {
        // เพิ่มหมวดหมู่ใหม่
        const newCategory: Category = {
          id: Date.now().toString(),
          ...formData,
          productCount: 0
        };
        setCategories([...categories, newCategory]);
        toast.success('เพิ่มหมวดหมู่สำเร็จ');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('ต้องการลบหมวดหมู่นี้ใช่หรือไม่?')) {
      return;
    }

    try {
      const updatedCategories = categories.filter(cat => cat.id !== categoryId);
      setCategories(updatedCategories);
      toast.success('ลบหมวดหมู่สำเร็จ');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      icon: '📦'
    });
    setEditingCategory(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">กำลังโหลด...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">จัดการหมวดหมู่สินค้า</h1>
            <p className="text-muted-foreground">
              จัดการหมวดหมู่สินค้าเพื่อให้ลูกค้าค้นหาสินค้าได้ง่ายขึ้น
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            เพิ่มหมวดหมู่
          </Button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {categories.map((category) => (
            <Card key={category.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                      style={{ backgroundColor: category.color + '20', border: `2px solid ${category.color}` }}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(category.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      สินค้า {category.productCount} รายการ
                    </span>
                  </div>
                  <Badge variant="secondary">
                    {category.productCount > 0 ? 'มีสินค้า' : 'ว่าง'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add/Edit Category Dialog */}
        {isDialogOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>
                  {editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">ชื่อหมวดหมู่</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="เช่น: บัตรเติมเงิน"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">คำอธิบาย</label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="อธิบายเกี่ยวกับหมวดหมู่"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">สี</label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          placeholder="#3B82F6"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">ไอคอน</label>
                      <Input
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        placeholder="📦"
                        maxLength={2}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        resetForm();
                      }}
                      className="flex-1"
                    >
                      ยกเลิก
                    </Button>
                    <Button type="submit" className="flex-1">
                      {editingCategory ? 'แก้ไข' : 'เพิ่ม'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesManager;
