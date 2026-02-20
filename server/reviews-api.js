const fs = require('fs');
const path = require('path');

// Path สำหรับเก็บข้อมูลรีวิว
const REVIEWS_DIR = path.join(__dirname, 'reviews');
const REVIEWS_FILE = path.join(__dirname, 'reviews.json');

// สร้างโฟลเดอร์และไฟล์ถ้ายังไม่มี
function ensureReviewsDirectory() {
  if (!fs.existsSync(REVIEWS_DIR)) {
    fs.mkdirSync(REVIEWS_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(REVIEWS_FILE)) {
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify({ reviews: [] }, 'utf8'));
  }
}

// อ่านข้อมูลรีวิวทั้งหมด
function getAllReviews() {
  try {
    ensureReviewsDirectory();
    const data = fs.readFileSync(REVIEWS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading reviews:', error);
    return { reviews: [] };
  }
}

// บันทึกข้อมูลรีวิว
function saveReviews(reviewsData) {
  try {
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviewsData, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving reviews:', error);
    return false;
  }
}

// ฟังก์ชัน setup API สำหรับรีวิว
function setupReviewsAPI(app) {
  // Import verifyToken from server.js (หรือสร้างใหม่ถ้าจำเป็นต้อง)
  const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log('=== Reviews API VerifyToken ===');
    console.log('Auth Header:', authHeader);
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'ไม่พบ token การยืนยันตัวตน'
      });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;
      
    console.log('Extracted token:', token);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'ไม่พบ token การยืนยันตัวตน'
      });
    }

    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, 'kunlun-secret-key-2026');
      console.log('Token decoded successfully:', decoded);
      req.user = decoded;
      console.log('User set in req:', req.user);
      next();
    } catch (error) {
      console.log('Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Token ไม่ถูกต้อง'
      });
    }
  };

  // API: ดึงรีวิวตาม productId
  app.get('/api/products/:productId/reviews', (req, res) => {
    try {
      const { productId } = req.params;
      console.log('Fetching reviews for productId:', productId);
      const reviewsData = getAllReviews();
      
      // กรองรีวิวตาม productId
      const productReviews = reviewsData.reviews.filter(review => review.productId === productId);
      
      // เรียงลำดับตามวันที่ล่าสุด
      productReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      console.log('Found reviews:', productReviews.length);
      
      res.json({
        success: true,
        reviews: productReviews,
        total: productReviews.length
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({
        success: false,
        message: 'ไม่สามารถดึงข้อมูลรีวิวได้'
      });
    }
  });

  // API: ตรวจสอบว่าผู้ใช้เคยรีวิวสินค้านี้หรือไม่
  app.get('/api/products/:productId/user-review', verifyToken, (req, res) => {
    try {
      const { productId } = req.params;
      
      // ตรวจสอบว่ามี user ใน req หรือไม่
      if (!req.user) {
        return res.json({
          success: true,
          hasReviewed: false,
          review: null
        });
      }
      
      const userId = req.user.id;
      console.log('Checking user review for productId:', productId, 'userId:', userId);
      const reviewsData = getAllReviews();
      
      // ตรวจสอบว่าผู้ใช้เคยรีวิวสินค้านี้หรือไม่
      const existingReview = reviewsData.reviews.find(review => 
        review.productId === productId && review.userId === userId
      );
      
      console.log('Existing review found:', !!existingReview);
      
      res.json({
        success: true,
        hasReviewed: !!existingReview,
        review: existingReview || null
      });
    } catch (error) {
      console.error('Error checking user review:', error);
      res.status(500).json({
        success: false,
        message: 'ไม่สามารถตรวจสอบข้อมูลรีวิวได้'
      });
    }
  });

  // API: เพิ่มรีวิวใหม่
  app.post('/api/products/:productId/reviews', (req, res) => {
    try {
      const { productId } = req.params;
      
      // ตรวจสอบว่ามี user ใน req หรือไม่
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'กรุณาเข้าสู่ระบบก่อนรีวิว'
        });
      }
      
      const userId = req.user.id;
      const { rating, comment } = req.body;
      
      // ตรวจสอบข้อมูล
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'คะแนนต้องอยู่ระหว่าง 1-5'
        });
      }
      
      if (!comment || comment.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'รีวิวต้องมีอย่างน้อย 10 ตัวอักษร'
        });
      }
      
      const reviewsData = getAllReviews();
      
      // ตรวจสอบว่าเคยรีวิวหรือไม่
      const existingReview = reviewsData.reviews.find(review => 
        review.productId === productId && review.userId === userId
      );
      
      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'คุณได้รีวิวสินค้านี้ไปแล้ว'
        });
      }
      
      // ดึงข้อมูลสินค้าเพื่อแสดงชื่อสินค้า
      const productData = getStockItemById(productId);
      const productName = productData ? productData.name : 'สินค้า';
      
      // สร้างรีวิวใหม่
      const newReview = {
        id: Date.now().toString(),
        productId,
        productName,
        userId,
        userName: req.user.username || 'ผู้ใช้',
        rating: parseInt(rating),
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
        helpful: 0,
        verified: true // สมมติว่าซื้อจริง (ในอนาคติตรวจสอบจาก order history)
      };
      
      // เพิ่มรีวิวใหม่
      reviewsData.reviews.push(newReview);
      
      // บันทึกข้อมูล
      if (saveReviews(reviewsData)) {
        res.json({
          success: true,
          message: 'รีวิวสินค้าสำเร็จ',
          review: newReview
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'ไม่สามารถบันทึกรีวิวได้'
        });
      }
    } catch (error) {
      console.error('Error adding review:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเพิ่มรีวิว'
      });
    }
  });

  // API: กดปุ่ม Helpful สำหรับรีวิว
  app.post('/api/reviews/:reviewId/helpful', (req, res) => {
    try {
      const { reviewId } = req.params;
      
      // ตรวจสอบว่ามี user ใน req หรือไม่
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'กรุณาเข้าสู่ระบบก่อนกดปุ่ม'
        });
      }
      
      const userId = req.user.id;
      const reviewsData = getAllReviews();
      
      // หารีวิวที่ต้องการ
      const reviewIndex = reviewsData.reviews.findIndex(review => review.id === reviewId);
      
      if (reviewIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบรีวิว'
        });
      }
      
      // เพิ่มจำนวนคนที่กด Helpful (ในอนาคติตรวจสอบว่ากดซ้ำไม่ได้)
      reviewsData.reviews[reviewIndex].helpful += 1;
      
      if (saveReviews(reviewsData)) {
        res.json({
          success: true,
          message: 'ขอบคุณที่บอกว่ารีวิวนี้มีประโยชน์',
          helpful: reviewsData.reviews[reviewIndex].helpful
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'ไม่สามารถอัปเดตข้อมูลได้'
        });
      }
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาด'
      });
    }
  });

  // API: ดึงคะแนนเฉลี่ยของสินค้า
  app.get('/api/products/:productId/rating', (req, res) => {
    try {
      const { productId } = req.params;
      const reviewsData = getAllReviews();
      
      // กรองรีวิวตาม productId
      const productReviews = reviewsData.reviews.filter(review => review.productId === productId);
      
      if (productReviews.length === 0) {
        return res.json({
          success: true,
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        });
      }
      
      // คำนวณคะแนนเฉลี่ย
      const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / productReviews.length;
      
      // คำนวณการกระจายของคะแนน
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      productReviews.forEach(review => {
        ratingDistribution[review.rating]++;
      });
      
      res.json({
        success: true,
        averageRating: Math.round(averageRating * 10) / 10, // ทศนิยม 1 ตำแหน่ง
        totalReviews: productReviews.length,
        ratingDistribution
      });
    } catch (error) {
      console.error('Error calculating rating:', error);
      res.status(500).json({
        success: false,
        message: 'ไม่สามารถคำนวณคะแนนได้'
      });
    }
  });
}

module.exports = { setupReviewsAPI };
