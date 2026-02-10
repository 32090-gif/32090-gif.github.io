import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription 
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Package,
  Image as ImageIcon,
  Tag,
  DollarSign,
  Hash,
  Calendar,
  AlertCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  stock: number;
  sold?: number;
  status: "active" | "inactive";
  image?: string;
  description?: string;
  discount?: number;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface ProductManagerProps {
  products: Product[];
  onProductUpdate: (product: Product) => void;
  onProductAdd: (product: Product) => void;
  onProductDelete: (productId: string) => void;
}

const ProductManager: React.FC<ProductManagerProps> = ({
  products,
  onProductUpdate,
  onProductAdd,
  onProductDelete
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    category: "",
    price: 0,
    originalPrice: 0,
    stock: 0,
    image: "",
    description: "",
    status: "active",
    discount: 0,
    tags: []
  });
  const [tagsInput, setTagsInput] = useState("");
  const [loading, setLoading] = useState(false);

  const categories = [
    "บัตรเติมเงิน",
    "ไอดีเกม",
    "ไอเทมในเกม",
    "แอปพลิเคชัน",
    "บริการพิเศษ"
  ];

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      price: 0,
      originalPrice: 0,
      stock: 0,
      image: "",
      description: "",
      status: "active",
      discount: 0,
      tags: []
    });
    setTagsInput("");
    setEditingProduct(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      ...product
    });
    setTagsInput(product.tags.join(", "));
    setIsDialogOpen(true);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTagsChange = (value: string) => {
    setTagsInput(value);
    const tagsArray = value.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0);
    handleInputChange("tags", tagsArray);
  };

  const generateId = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-')
      .replace(/[ก-๙]/g, (char) => {
        const thaiToEng = {
          'ก': 'g', 'ข': 'k', 'ค': 'k', 'ง': 'ng',
          'จ': 'j', 'ฉ': 'ch', 'ช': 'ch', 'ซ': 's',
          'ย': 'y', 'ร': 'r', 'ล': 'l', 'ว': 'w',
          'ส': 's', 'ห': 'h', 'อ': 'o', 'ฮ': 'h',
          'บ': 'b', 'ป': 'p', 'ผ': 'ph', 'ฝ': 'f',
          'พ': 'ph', 'ฟ': 'f', 'ภ': 'ph', 'ม': 'm',
          'ด': 'd', 'ต': 't', 'ถ': 'th', 'ท': 'th',
          'ธ': 'th', 'น': 'n', 'ฬ': 'l', 'ณ': 'n'
        };
        return thaiToEng[char as keyof typeof thaiToEng] || char;
      }) + '-' + Date.now();
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.category || !formData.price) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกชื่อสินค้า หมวดหมู่ และราคา",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const now = new Date().toISOString();
      
      const productData: Product = {
        ...formData as Product,
        id: editingProduct ? editingProduct.id : generateId(formData.name!),
        updatedAt: now,
        createdAt: editingProduct ? editingProduct.createdAt : now
      };

      if (editingProduct) {
        await onProductUpdate(productData);
        toast({
          title: "แก้ไขสินค้าสำเร็จ",
          description: `แก้ไข ${productData.name} เรียบร้อย`
        });
      } else {
        await onProductAdd(productData);
        toast({
          title: "เพิ่มสินค้าสำเร็จ",
          description: `เพิ่ม ${productData.name} เรียบร้อย`
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกสินค้าได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`ต้องการลบสินค้า "${product.name}" หรือไม่?`)) return;

    try {
      await onProductDelete(product.id);
      toast({
        title: "ลบสินค้าสำเร็จ",
        description: `ลบ ${product.name} เรียบร้อย`
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบสินค้าได้",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            จัดการสินค้า ({products.length})
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog} className="bg-gradient-to-r from-green-600 to-emerald-600">
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มสินค้าใหม่
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}
                </DialogTitle>
                <DialogDescription>
                  กรอกข้อมูลสินค้าด้านล่าง ข้อมูลจะถูกบันทึกเป็น JSON format
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      ชื่อสินค้า *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name || ""}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="เช่น: Steam Wallet 20 USD"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category" className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      หมวดหมู่ *
                    </Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกหมวดหมู่" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="price" className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        ราคาขาย *
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price || ""}
                        onChange={(e) => handleInputChange("price", Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="originalPrice">ราคาเดิม</Label>
                      <Input
                        id="originalPrice"
                        type="number"
                        value={formData.originalPrice || ""}
                        onChange={(e) => handleInputChange("originalPrice", Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="stock" className="flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        จำนวนสต็อก
                      </Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock || ""}
                        onChange={(e) => handleInputChange("stock", Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="discount">ส่วนลด (%)</Label>
                      <Input
                        id="discount"
                        type="number"
                        value={formData.discount || ""}
                        onChange={(e) => handleInputChange("discount", Number(e.target.value))}
                        placeholder="0"
                        max="100"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="status">สถานะ</Label>
                    <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">เปิดขาย</SelectItem>
                        <SelectItem value="inactive">หยุดขาย</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="image" className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      URL รูปภาพ
                    </Label>
                    <Input
                      id="image"
                      value={formData.image || ""}
                      onChange={(e) => handleInputChange("image", e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                    {formData.image && (
                      <div className="mt-2">
                        <img
                          src={formData.image}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-lg border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description">คำอธิบาย</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ""}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="อธิบายเกี่ยวกับสินค้า..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="tags">แท็ก (คั่นด้วยจุลภาค)</Label>
                    <Input
                      id="tags"
                      value={tagsInput}
                      onChange={(e) => handleTagsChange(e.target.value)}
                      placeholder="gaming, topup, steam"
                    />
                    {formData.tags && formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {formData.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {editingProduct && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        สร้างเมื่อ: {new Date(editingProduct.createdAt).toLocaleString('th-TH')}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        แก้ไขล่าสุด: {new Date(editingProduct.updatedAt).toLocaleString('th-TH')}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  <X className="w-4 h-4 mr-2" />
                  ยกเลิก
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>ยังไม่มีสินค้า</p>
              <p className="text-sm">คลิก "เพิ่มสินค้าใหม่" เพื่อเริ่มต้น</p>
            </div>
          ) : (
            products.map((product) => (
              <div key={product.id} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9IiNjY2MiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMCAxOGMtNC40MSAwLTgtMy41OS04LThzMy41OS04IDgtOCA4IDMuNTkgOCA4LTMuNTkgOC04IDh6bS0xLTEzaDJWOWgtMnYyem0wIDRoMnYtMmgtMnYyeiIvPjwvc3ZnPg==";
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{product.name}</h3>
                        <Badge variant={product.status === 'active' ? 'default' : 'destructive'}>
                          {product.status === 'active' ? 'เปิดขาย' : 'หยุดขาย'}
                        </Badge>
                        <Badge variant="secondary">{product.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-bold text-primary">฿{product.price.toLocaleString()}</span>
                        {product.originalPrice > product.price && (
                          <span className="line-through text-muted-foreground">฿{product.originalPrice.toLocaleString()}</span>
                        )}
                        <span className={product.stock < 10 ? "text-red-500 font-semibold" : "text-green-500"}>
                          สต็อก: {product.stock}
                        </span>
                        {product.discount > 0 && (
                          <Badge variant="outline" className="text-red-500">-{product.discount}%</Badge>
                        )}
                      </div>
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {product.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(product)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(product)} className="text-red-600 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductManager;