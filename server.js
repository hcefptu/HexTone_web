const express = require('express');
const cors = require('cors');
const path = require('path');
const oracledb = require('oracledb');

// Enable pure JavaScript Thin Mode (seamless on both Windows and Linux)
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Oracle Database connection configuration
const dbConfig = {
  user: process.env.DB_USER || 'hextone_user',
  password: process.env.DB_PASSWORD || 'HexTonePass123!',
  connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/FREEPDB1'
};

// Curated selection of 6 instruments
const seedProducts = [
  {
    id: "hex-esp-horizon",
    name: "ESP E-II Horizon FR-II HH",
    brand: "ESP",
    category: "Electric",
    price: 2499,
    toneFreq: JSON.stringify([164.81, 220.00, 293.66, 392.00]),
    image: "https://vietmusic.vn/cdn/shop/files/original_d1ea387f-c986-421f-a2b1-8ffd1be3fbfe.webp?v=1773291875&width=1946",
    specs: JSON.stringify({ top: "Quilted Maple", body: "Mahogany", pickups: "EMG 66/57 Brushed Black Chrome" }),
    tag: "Shred Master",
    youtube_url: "https://www.youtube.com/watch?v=dA4tdHmPwQg"
  },
  {
    id: "hex-ibanez-a528",
    name: "Ibanez A528 HH",
    brand: "Ibanez",
    category: "Electric",
    price: 1199,
    toneFreq: JSON.stringify([130.81, 196.00, 261.63, 329.63]),
    image: "https://www.zikinf.com/_gfx/matos/dyn/large/ibanez-a528.png?1775110648",
    specs: JSON.stringify({ top: "Linden Wood", body: "Linden Wood", pickups: "Classic Elite Humbuckers" }),
    tag: "Vintage Semi-Hollow",
    youtube_url: "https://www.youtube.com/watch?v=YBxjHk3cVn4"
  },
  {
    id: "hex-charvel-guthrie",
    name: "Charvel Guthrie Govan Signature HHS",
    brand: "Charvel",
    category: "Electric",
    price: 3899,
    toneFreq: JSON.stringify([146.83, 220.00, 293.66, 440.00]),
    image: "https://vietmusic.vn/cdn/shop/files/dan-guitar-dien-charvel-guthrie-govan-signature-hhs-maple-fingerboard-limited-britannica-red-qua-su-dung-viet-music.jpg?v=1711798129",
    specs: JSON.stringify({ top: "Flame Maple (Britannica Red)", body: "Caramelized Basswood", pickups: "Custom Charvel MF Humbucking/Single-Coil" }),
    tag: "Virtuoso Art",
    youtube_url: "https://www.youtube.com/watch?v=Zut8YW8M5q8"
  },
  {
    id: "hex-schecter-syn",
    name: "Synyster Gates signature",
    brand: "Schecter",
    category: "Electric",
    price: 1599,
    toneFreq: JSON.stringify([73.42, 110.00, 146.83, 196.00]),
    image: "https://cdn.mos.cms.futurecdn.net/2qJH53RBKqPGoi8M8Xuddc.jpg",
    specs: JSON.stringify({ top: "Silver Pinstripes", body: "Mahogany", pickups: "USA Synyster Gates Signature" }),
    tag: "Avenged Icon",
    youtube_url: "https://www.youtube.com/watch?v=DpuTB9Gt3iA"
  },
  {
    id: "hex-jackson-dk2",
    name: "Jackson Pro Series Dinky DK2 Ash HH",
    brand: "Jackson",
    category: "Electric",
    price: 1099,
    toneFreq: JSON.stringify([164.81, 246.94, 329.63, 493.88]),
    image: "https://shredguitars.com/wp-content/uploads/2025/product/420-pro-series-dinky-dk2-ash--1.png",
    specs: JSON.stringify({ top: "Sandblasted Ash", body: "Ash", pickups: "Seymour Duncan JB / '59" }),
    tag: "Raw Modern",
    youtube_url: "https://www.youtube.com/watch?v=DE9QCN6ho2g"
  },
  {
    id: "hex-esp-alexi",
    name: "ESP Alexi Hexed H",
    brand: "ESP",
    category: "Electric",
    price: 1799,
    toneFreq: JSON.stringify([110.00, 164.81, 220.00, 293.66]),
    image: "https://cdn.connectsites.net/user_files/esp/product_images/000/031/768/original.png?1630682387&height=1200&width=1200",
    specs: JSON.stringify({ top: "Purple with White Pinstripes", body: "Alder Offset V", pickups: "EMG HZ-FH2 w/ Preamp Boost" }),
    tag: "Wildchild Tribute",
    youtube_url: "https://www.youtube.com/watch?v=umBMPbU8d6k"
  }
];

// Initialize Database Pool and PRODUCTS schema
async function initDatabase() {
  let pool;
  let retries = 10;
  while (retries > 0) {
    try {
      pool = await oracledb.createPool({
        ...dbConfig,
        poolMin: 2,
        poolMax: 10,
        poolIncrement: 1
      });
      console.log(">>> Successfully connected to Oracle Database!");
      break;
    } catch (err) {
      console.log(`>>> Waiting for Oracle Database to be ready... (${retries} attempts remaining)`);
      retries -= 1;
      await new Promise(r => setTimeout(r, 6000));
    }
  }

  if (!pool) return;

  let conn;
  try {
    conn = await pool.getConnection();

    // Create PRODUCTS table if not exists
    await conn.execute(`
      BEGIN
        EXECUTE IMMEDIATE '
          CREATE TABLE PRODUCTS (
            ID VARCHAR2(50) PRIMARY KEY,
            NAME VARCHAR2(150) NOT NULL,
            BRAND VARCHAR2(50) NOT NULL,
            CATEGORY VARCHAR2(50) NOT NULL,
            PRICE NUMBER(10, 2) NOT NULL,
            TONE_FREQ VARCHAR2(200),
            IMAGE VARCHAR2(500),
            SPECS VARCHAR2(1000),
            TAG VARCHAR2(50),
            YOUTUBE_URL VARCHAR2(500)
          )
        ';
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLCODE != -955 THEN RAISE; END IF;
      END;
    `);

    // Seed data if table is currently empty
    const countCheck = await conn.execute(`SELECT COUNT(*) AS CNT FROM PRODUCTS`);
    if (countCheck.rows[0].CNT === 0) {
      console.log(">>> Seeding 6 curated instruments into Oracle Database...");
      for (const p of seedProducts) {
        await conn.execute(
          `INSERT INTO PRODUCTS (ID, NAME, BRAND, CATEGORY, PRICE, TONE_FREQ, IMAGE, SPECS, TAG, YOUTUBE_URL)
           VALUES (:id, :name, :brand, :category, :price, :toneFreq, :image, :specs, :tag, :youtube_url)`,
          p
        );
      }
      console.log(">>> Seeding completed successfully!");
    }
  } catch (e) {
    console.error("Schema Init Error:", e);
  } finally {
    if (conn) await conn.close();
  }
}

// 1. API Home: Top featured instruments
app.get('/api/home', async (req, res) => {
  let conn;
  try {
    conn = await oracledb.getConnection();
    const result = await conn.execute(`
      SELECT ID, NAME, BRAND, CATEGORY, PRICE, TONE_FREQ, IMAGE, SPECS, TAG, YOUTUBE_URL
      FROM PRODUCTS
      FETCH FIRST 3 ROWS ONLY
    `);

    const formatted = result.rows.map(r => ({
      id: r.ID,
      name: r.NAME,
      brand: r.BRAND,
      category: r.CATEGORY,
      price: r.PRICE,
      toneFreq: JSON.parse(r.TONE_FREQ),
      image: r.IMAGE,
      specs: JSON.parse(r.SPECS),
      tag: r.TAG,
      youtubeUrl: r.YOUTUBE_URL
    }));

    res.json({
      hero: {
        headline: "PURE RESONANCE. OBSIDIAN PRECISION.",
        subline: "Hex Tone curates masterpieces of electric and acoustic engineering for artists seeking sonic perfection.",
        cta: "Explore Vault"
      },
      featured: formatted
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// 2. API Products: Filter and catalog list
app.get('/api/products', async (req, res) => {
  const { category, brand, search } = req.query;
  let conn;
  try {
    conn = await oracledb.getConnection();
    let query = `SELECT ID, NAME, BRAND, CATEGORY, PRICE, TONE_FREQ, IMAGE, SPECS, TAG, YOUTUBE_URL FROM PRODUCTS WHERE 1=1`;
    const binds = {};

    if (category && category !== 'all') {
      query += ` AND LOWER(CATEGORY) = LOWER(:cat)`;
      binds.cat = category;
    }
    if (brand && brand !== 'all') {
      query += ` AND LOWER(BRAND) = LOWER(:brd)`;
      binds.brd = brand;
    }
    if (search) {
      query += ` AND LOWER(NAME) LIKE LOWER(:srch)`;
      binds.srch = `%${search}%`;
    }

    const result = await conn.execute(query, binds);
    const formatted = result.rows.map(r => ({
      id: r.ID,
      name: r.NAME,
      brand: r.BRAND,
      category: r.CATEGORY,
      price: r.PRICE,
      toneFreq: JSON.parse(r.TONE_FREQ),
      image: r.IMAGE,
      specs: JSON.parse(r.SPECS),
      tag: r.TAG,
      youtubeUrl: r.YOUTUBE_URL
    }));

    res.json({
      total: formatted.length,
      data: formatted
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) await conn.close();
  }
});

// 3. API About: Atelier Philosophy
app.get('/api/about', (req, res) => {
  res.json({
    brand: "HEX TONE INSTRUMENTS",
    manifesto: "We do not see a guitar merely as wood and metal, but as a hexagonal resonance machine. Every instrument departing our workshop undergoes rigorous action calibration and studio-grade intonation setup.",
    locations: ["Tokyo Studio", "Berlin Workshop", "Da Nang Sound Lab"],
    stats: [
      { label: "Hand-checked Setup", value: "100%" },
      { label: "Tube Amp Tested", value: "48 Hrs" },
      { label: "Boutique Luthiers", value: "12" }
    ]
  });
});

// Launch server and trigger DB initialization
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`>>> Hex Tone server is running at: http://localhost:${PORT}`);
  await initDatabase();
});