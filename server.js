const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Dữ liệu mẫu (Khuôn thông số và ảnh placeholder chất lượng cao)
const products = [
  {
    id: "hex-01",
    name: "Ibanez Prestige RG5120M",
    brand: "Ibanez",
    category: "Electric",
    price: 2199,
    toneFreq: [196, 293.66, 392, 587.33], // Dây mô phỏng audio
    image: "https://images.unsplash.com/photo-1550291652-6ea9114a47b1?q=80&w=800&auto=format&fit=crop",
    specs: { top: "Ash", body: "African Mahogany", pickups: "Fishman Fluence Modern" },
    tag: "High Performance"
  },
  {
    id: "hex-02",
    name: "Fender American Vintage II '61",
    brand: "Fender",
    category: "Electric",
    price: 2249,
    toneFreq: [164.81, 246.94, 329.63, 493.88],
    image: "https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?q=80&w=800&auto=format&fit=crop",
    specs: { top: "Alder", body: "Alder", pickups: "Pure Vintage '61 Single-Coil" },
    tag: "Classic Vibe"
  },
  {
    id: "hex-03",
    name: "Gibson Les Paul Standard '60s",
    brand: "Gibson",
    category: "Electric",
    price: 2799,
    toneFreq: [130.81, 196.00, 261.63, 392.00],
    image: "https://images.unsplash.com/photo-1525201548942-d8732f6617a0?q=80&w=800&auto=format&fit=crop",
    specs: { top: "AA Figured Maple", body: "Mahogany", pickups: "60s Burstbucker" },
    tag: "Studio Icon"
  },
  {
    id: "hex-04",
    name: "Taylor Builder's Edition 814ce",
    brand: "Taylor",
    category: "Acoustic",
    price: 3999,
    toneFreq: [110.00, 164.81, 220.00, 329.63],
    image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?q=80&w=800&auto=format&fit=crop",
    specs: { top: "Lutz Spruce", body: "Indian Rosewood", pickups: "Expression System 2" },
    tag: "Grand Auditorium"
  },
  {
    id: "hex-05",
    name: "Martin D-28 Standard Modern Deluxe",
    brand: "Martin",
    category: "Acoustic",
    price: 3399,
    toneFreq: [82.41, 123.47, 164.81, 246.94],
    image: "https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?q=80&w=800&auto=format&fit=crop",
    specs: { top: "Sitka Spruce (VTS)", body: "East Indian Rosewood", pickups: "Aura VT Blend" },
    tag: "Heritage Dreadnought"
  },
  {
    id: "hex-06",
    name: "PRS Custom 24 10-Top",
    brand: "PRS",
    category: "Electric",
    price: 4550,
    toneFreq: [146.83, 220.00, 293.66, 440.00],
    image: "https://images.unsplash.com/photo-1584679109597-c656b19974c9?q=80&w=800&auto=format&fit=crop",
    specs: { top: "Carved Figured Maple", body: "Mahogany", pickups: "PRS 85/15" },
    tag: "Boutique Craft"
  }
];

// 1. API Home: Banner & Featured items
app.get('/api/home', (req, res) => {
  res.json({
    hero: {
      headline: "PURE RESONANCE. OBSIDIAN PRECISION.",
      subline: "Hex Tone tuyển chọn những tuyệt tác guitar điện và acoustic dành cho nghệ sĩ kiếm tìm âm sắc hoàn mỹ.",
      cta: "Explore Vault"
    },
    featured: products.slice(0, 3)
  });
});

// 2. API Products: Danh sách & Lọc theo Category/Brand
app.get('/api/products', (req, res) => {
  const { category, brand, search } = req.query;
  let results = [...products];

  if (category && category !== 'all') {
    results = results.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }
  if (brand && brand !== 'all') {
    results = results.filter(p => p.brand.toLowerCase() === brand.toLowerCase());
  }
  if (search) {
    results = results.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }

  res.json({
    total: results.length,
    data: results
  });
});

// 3. API About: Giới thiệu thương hiệu
app.get('/api/about', (req, res) => {
  res.json({
    brand: "HEX TONE INSTRUMENTS",
    manifesto: "Chúng tôi coi guitar không đơn thuần là một nhạc cụ bằng gỗ và kim loại, mà là một cỗ máy cộng hưởng tần số (Hexagonal Resonance). Từng cây đàn rời khỏi xưởng đều được cân chỉnh hành trình phím (action) và intonation theo tiêu chuẩn phòng thu.",
    locations: ["Tokyo Studio", "Berlin Workshop", "Da Nang Sound Lab"],
    stats: [
      { label: "Hand-checked Setup", value: "100%" },
      { label: "Tube Amp Tested", value: "48 Hrs" },
      { label: "Boutique Luthiers", value: "12" }
    ]
  });
});

// Chạy server
app.listen(PORT, () => {
  console.log(`>>> Hex Tone server is running at: http://localhost:${PORT}`);
});