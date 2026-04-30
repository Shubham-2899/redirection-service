# Redirection Service

A standalone Express.js service for URL shortening, click tracking, email open tracking, and unsubscribe management for the RASPix media platform.

## Features

- **URL Shortening & Click Tracking** — Generate short URLs with detailed analytics
- **Email Open Tracking** — Transparent 1×1 pixel tracking with encrypted campaign/offer data
- **Unsubscribe Management** — Self-service unsubscribe page with reCAPTCHA protection
- **Caching** — In-memory cache (24h TTL) for fast redirects
- **Security** — Helmet, rate limiting, CSP nonces, honeypot protection

## Tech Stack

- **Framework:** Express 4
- **Language:** JavaScript (CommonJS)
- **Database:** MongoDB via Mongoose 8
- **Cache:** node-cache (in-memory)
- **Security:** helmet + express-rate-limit + CSP
- **Views:** EJS templates
- **Encryption:** AES-256-CBC with base64url encoding

## Project Structure

```
redirection-service/
├── src/
│   ├── server1.js              # Main entry point
│   ├── config/
│   │   └── config.js           # Environment configuration
│   ├── routes/
│   │   ├── api.js              # Main routes
│   │   └── contentRoute.js     # Tracking pixel endpoint
│   ├── controllers/
│   │   └── urlController.js    # URL redirect logic
│   ├── services/
│   │   ├── contentService.js   # Pixel serving & tracking
│   │   ├── recaptchaService.js # reCAPTCHA verification
│   │   └── urlService.js       # URL utilities
│   ├── middlewares/
│   │   ├── cacheMiddleware.js  # NodeCache instance
│   │   ├── rateLimiter.js      # Rate limiting
│   │   └── security.js         # Security headers
│   ├── models/
│   │   ├── Url.js              # URL schema
│   │   └── Email_list.js       # Suppression list schema
│   ├── utils/
│   │   └── crypto.js           # AES encryption/decryption
│   └── views/
│       ├── index.ejs           # Home page
│       ├── offerend.ejs        # 404/expired offers
│       └── unsubscribe.ejs     # Unsubscribe form
├── config/
│   └── config.js               # Config loader
├── .env                        # Environment variables
├── package.json
└── server.js                   # Legacy (not used)
```

## Installation & Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd redirection-service
npm install
```

### 2. Environment Configuration

Create `.env` file:

```bash
# Database
DB_CONNECTION_STRING=mongodb+srv://user:pass@cluster.mongodb.net/database
LOCAL_DB_CONNECTION_STRING=mongodb://localhost:27017/short-url

# Server
PORT=3000

# Security
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
SECRET_KEY=your_32_character_aes_encryption_key

# Rate Limiting
RATE_LIMIT=100
```

### 3. Start the Service

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The service will be available at `http://localhost:3000`.

## Server Deployment

### Option 1: PM2 Process Manager

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Clone and setup the service
git clone <repository-url>
cd redirection-service
npm install --production

# Start with PM2
pm2 start src/server1.js --name "redirection-service"
pm2 save
pm2 startup
```

### Option 2: Docker Deployment

**Create `docker-compose.yml`:**

```yaml
services:
  redirection-service:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: mms-redirection-service
    restart: unless-stopped
    ports:
      - "3000:3000"
  
    env_file:
      - .env

    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)}).on('error', () => process.exit(1))"]
      interval: 30s
      timeout: 3s
      retries: 3

    volumes:
      - ./logs:/app/logs
```

**Update `Dockerfile` (if needed):**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "src/server1.js"]
```

**Deploy with Docker:**

```bash
# Clone and setup
git clone <repository-url>
cd redirection-service

# Create .env file with your configuration
cp .env.example .env
nano .env

# Build and start
docker compose up -d

# View logs
docker compose logs -f redirection-service

# Stop service
docker compose down
```

**Docker Management Commands:**

```bash
# View running containers
docker ps

# View logs
docker logs mms-redirection-service

# Restart service
docker restart mms-redirection-service

# Update service
git pull
docker compose build
docker compose up -d

# Health check
docker exec mms-redirection-service node -e "require('http').get('http://localhost:3000/', (res) => { console.log('Status:', res.statusCode) })"
```

### Nginx Configuration

Create nginx site configuration:

```bash
sudo nano /etc/nginx/sites-available/yourdomain.com
```

**Basic Configuration:**

```nginx
server {
    listen 80;
    server_name yourdomain.com;
  
    # Optional: Preserve encoded slashes for legacy tracking URLs
    # (New URLs generated after v2.0 don't need this)
    merge_slashes off;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
  
        # Optional: Preserve encoded slashes (see note below)
        merge_slashes off;
    }
}
```

**SSL Configuration (recommended):**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Certbot will automatically update the nginx config for HTTPS
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Nginx `merge_slashes` Setting (Optional)

**⚠️ Important Note:** The `merge_slashes off` setting is **optional** and only needed for **legacy tracking URLs** generated before v2.0.

- **Legacy URLs** (pre-v2.0): May contain `%2F` (encoded slashes) that nginx decodes by default, breaking routing
- **New URLs** (v2.0+): Use base64url encoding (no `/` or `+` characters), so nginx behavior doesn't matter

**When to include `merge_slashes off`:**

- ✅ If you have existing email campaigns with tracking URLs that might contain `%2F`
- ✅ For maximum compatibility during transition period
- ❌ Not needed if this is a fresh deployment with no legacy URLs

**If you skip this setting:**

- New tracking URLs will work perfectly
- Legacy tracking URLs with `%2F` may show "Offer Ended" page instead of tracking pixel
- Click tracking URLs are unaffected (they use a different route pattern)

### Monitoring & Logs

### PM2 Process Management (Option 1)

```bash
# View logs
pm2 logs redirection-service

# Monitor performance
pm2 monit

# Restart service
pm2 restart redirection-service

# View process status
pm2 status
```

### Docker Management (Option 2)

```bash
# View logs
docker compose logs -f redirection-service

# Restart service
docker compose restart redirection-service

# Update and redeploy
git pull
docker compose build
docker compose up -d

# View container status
docker ps
```

### Health Check

```bash
# Direct connection
curl http://localhost:3000/
# Should return the home page HTML

# Through nginx (if configured)
curl http://yourdomain.com/
# Should return the home page HTML

# Docker health check
docker exec mms-redirection-service node -e "require('http').get('http://localhost:3000/', (res) => { console.log('Status:', res.statusCode) })"
```

## Support

For issues and questions:

- Check the logs: `pm2 logs redirection-service`
- Review nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Database connectivity: Verify MongoDB connection string
