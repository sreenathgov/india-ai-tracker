# Configuration Overview

**India AI Policy Tracker - Service Dependencies & Configuration**

Last Updated: January 27, 2026

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [External Services](#external-services)
3. [API Keys Configuration](#api-keys-configuration)
4. [Provider Switching](#provider-switching)
5. [Configuration Files](#configuration-files)
6. [Troubleshooting](#troubleshooting)

---

## 🏗️ System Overview

The India AI Tracker uses a **3-layer hybrid processing pipeline** to minimize costs while maintaining quality:

```
┌─────────────────────────────────────────────────┐
│ LAYER 1: Rule-Based Filter (FREE)              │
│ - No external services                          │
│ - Pure Python keyword matching                  │
│ - 2,000-3,500 articles → ~1,200-1,400 articles │
└────────────────┬────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────┐
│ LAYER 2: Bulk AI Processing                    │
│ - Provider: Groq (primary) OR Ollama (fallback)│
│ - 1,200-1,400 articles → ~900-1,100 articles   │
│ - Cost: $0 (Groq free tier)                    │
└────────────────┬────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────┐
│ LAYER 3: Premium Polish                        │
│ - Provider: Groq (Llama 3.3 70B)               │
│ - Top 30-50 important articles only            │
│ - Cost: $0 (Groq free tier)                    │
└─────────────────────────────────────────────────┘
```

---

## 🌐 External Services

### **Services We Use:**

| Service | Purpose | Required? | Fallback |
|---------|---------|-----------|----------|
| **Groq API** | Layer 2 & 3 processing | Yes | Ollama (local) |
| **Gemini API** | ~~Layer 3 premium polish~~ Deprecated | No | — |
| **Ollama** | Layer 2/3 fallback (local) | Optional | None |

### **Services We DON'T Use:**

- ❌ No database hosting (SQLite runs locally)
- ❌ No server hosting for processing (runs on your Mac)
- ❌ No paid AI APIs (all within free tiers)

---

## 🔑 API Keys Configuration

### **1. Groq API Key**

**Purpose:** Primary provider for Layer 2 bulk processing

**Free Tier:**
- 14,400 requests/day
- 131,072 tokens/minute
- Model: Llama 3.1 70B

**How to Get:**
1. Go to https://console.groq.com/
2. Sign up with email
3. Navigate to "API Keys"
4. Create new key
5. Copy the key (starts with `gsk_...`)

**Configuration:**
```bash
# In backend/.env file
GROQ_API_KEY=gsk_your_key_here
```

---

### **2. Gemini API Key**

**Purpose:** Premium provider for Layer 3 polish

**Free Tier:**
- 1,500 requests/day (we use ~30-50)
- 1M tokens/minute
- Model: Gemini 1.5 Flash

**How to Get:**
1. Go to https://ai.google.dev/
2. Click "Get API Key"
3. Create project in Google Cloud
4. Enable Generative Language API
5. Copy key (starts with `AIza...`)

**Configuration:**
```bash
# In backend/.env file
GEMINI_API_KEY=AIzaSyD...your_key_here
```

**Current Key (in your .env):**
```
GEMINI_API_KEY=AIzaSyDG-kN6DPIYKYBdf9d0wnjNxEA0XDF7gKc
```

---

### **3. Ollama (Optional Local Fallback)**

**Purpose:** Fallback when Groq hits rate limits

**Free:** 100% free, runs locally on your Mac

**Installation:**
```bash
# Install Ollama
brew install ollama

# Start Ollama service
ollama serve

# Pull Llama 3.2 3B model (~2GB)
ollama pull llama3.2:3b
```

**Configuration:**
```bash
# In backend/.env file (optional)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
```

**No API key needed** - runs entirely offline

---

## 🔄 Provider Switching

### **Layer 2: Groq → Ollama Switching**

**Automatic Fallback:**
The system automatically switches to Ollama if Groq fails:

```python
# Happens automatically when:
# - Groq rate limit exceeded
# - Groq API timeout
# - Groq quota exhausted
# - Network error

# You'll see in reports:
# ⚠️  Layer 2 switched from Groq to Ollama (123 articles remaining)
```

**Manual Configuration:**
```bash
# In backend/.env file

# Use Groq (default)
LAYER2_PROVIDER=groq

# Force Ollama
LAYER2_PROVIDER=ollama

# Use Gemini for Layer 2 (not recommended - slower/expensive)
LAYER2_PROVIDER=gemini
```

---

### **Layer 3: Groq (Primary)**

**Configuration:**
```bash
# In backend/.env file

# Use Groq (default - recommended)
LAYER3_PROVIDER=groq

# Use Gemini as fallback (optional, but expensive)
LAYER3_PROVIDER=gemini
```

**Why Groq for Layer 3:**
- Free tier (14,400 requests/day - plenty of capacity)
- Fast processing
- Consistent with Layer 2 (same provider)
- No quota exhaustion issues like Gemini
- Cost-effective as system scales

---

## 📁 Configuration Files

### **1. Environment Variables (.env)**

Location: `backend/.env`

```bash
# ==================== API KEYS ====================
GROQ_API_KEY=gsk_your_key_here
GEMINI_API_KEY=AIzaSyD_your_key_here

# ==================== LAYER 2 CONFIG ====================
LAYER2_PROVIDER=groq           # groq, ollama, or gemini
LAYER2_MODEL=llama-3.1-70b-versatile  # For Groq
LAYER2_BATCH_SIZE=10           # Articles per batch

# ==================== LAYER 3 CONFIG ====================
LAYER3_PROVIDER=groq           # groq or gemini
LAYER3_MODEL=llama-3.3-70b-versatile  # For Groq
LAYER3_TOP_N=50                # Number of articles for premium processing

# ==================== OLLAMA CONFIG (Optional) ====================
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b

# ==================== PROCESSING OPTIONS ====================
ENABLE_CHECKPOINTING=true      # Resume interrupted jobs
CHECKPOINT_INTERVAL=50         # Save progress every N articles
ENABLE_REPORTS=true            # Generate daily reports

# ==================== ADMIN CREDENTIALS ====================
ADMIN_USERNAME=admin
ADMIN_PASSWORD=sreenath
SECRET_KEY=dev-key-change-in-production
```

---

### **2. Filter Configuration (filters.yaml)**

Location: `backend/config/filters.yaml`

**Purpose:** Contains all keywords, weights, and importance hints

**Structure:**
```yaml
ai_keywords:
  strong:  # Must have for AI relevance
    - keyword: "artificial intelligence"
      weight: 100
      categories: ["ai_tech"]
      importance_boost: 0

    - keyword: "AI regulation"
      weight: 150
      categories: ["policy", "government"]
      importance_boost: 30  # Used in Layer 3 scoring

india_markers:
  tier1:  # 50 points - Strong India signals
    states: [...]
    cities: [...]

  tier2:  # 40 points - Indian companies
    companies: [...]

  tier3:  # 60 points - Government/institutions
    government: [...]
    importance_boost: 40

thresholds:
  pass_filter: 40        # Minimum score to pass Layer 1
  high_confidence: 80    # High confidence threshold
  borderline_min: 30     # Log borderline articles
```

**You can edit this file without coding!**

---

## 🔧 Troubleshooting

### **Common Issues:**

#### **1. "Groq rate limit exceeded"**
```
✅ AUTOMATIC: System switches to Ollama
❌ If Ollama not installed: Install with `brew install ollama`
```

#### **2. "Ollama connection refused"**
```bash
# Start Ollama service
ollama serve

# In another terminal, pull model
ollama pull llama3.2:3b
```

#### **3. "Groq quota exceeded at Layer 3"**
```
❌ RARE: Groq free tier has 14,400 requests/day
🔧 Fix 1: Switch to Gemini for Layer 3 (LAYER3_PROVIDER=gemini)
🔧 Fix 2: Upgrade Groq to paid tier at https://console.groq.com/
```

#### **4. "API key invalid"**
```bash
# Test Groq key
curl -H "Authorization: Bearer $GROQ_API_KEY" \
     https://api.groq.com/openai/v1/models

# Test Gemini key
curl "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY"
```

---

## 📊 Cost Monitoring

### **Check Your Usage:**

**Groq:**
- Dashboard: https://console.groq.com/usage
- Free tier: 14,400 requests/day
- We use: ~1,200/day (8%)

**Gemini:**
- Dashboard: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
- Free tier: 1,500 requests/day
- We use: ~30-50/day (3%)

### **Daily Reports Show Usage:**
```
LAYER 2: Bulk Processing
  Provider:   Groq
  ⚠️  Groq quota used: 1,247/14,400 (8.7%)

LAYER 3: Premium Polish
  Provider:   Groq
  ⚠️  Groq quota used: 50/14,400 (0.3%)
  Total Groq: 1,297/14,400 (9%)
```

---

## 🆘 Getting Help

**If something goes wrong:**

1. Check `reports/daily_report_YYYY-MM-DD.json` for errors
2. Check `backend/logs/processor.log` for detailed logs
3. Check this file for configuration guidance
4. Restore from backup: `git checkout backup-before-hybrid-pipeline`

**Configuration Questions:**
- Which provider should I use? → Use defaults (Groq + Gemini)
- Can I use only free services? → Yes! Everything is free
- Do I need Ollama? → Optional, but recommended as fallback

---

## 📝 Summary

**Required for Operation:**
- ✅ Groq API key (free) - for Layers 2 & 3
- ❌ Gemini API key (deprecated for Layer 3)
- ⚠️  Ollama (optional but recommended as fallback)

**Monthly Cost:**
- ✅ $0 - Everything uses Groq free tier
- 📊 Expected usage: ~1,300 requests/day (9% of free tier)

**Next Steps:**
- Read `docs/ARCHITECTURE.md` for system design
- Read `scripts/README.md` for daily operations
