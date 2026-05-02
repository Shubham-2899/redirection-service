# API Reference

## API Endpoints

| Method   | Path                 | Description                                |
| -------- | -------------------- | ------------------------------------------ |
| `GET`  | `/:shortId/*/*`    | Redirect short URL with click tracking     |
| `GET`  | `/content/:data`   | Email open tracking pixel (encrypted data) |
| `GET`  | `/unsubscribe`     | Unsubscribe form page                      |
| `POST` | `/api/unsubscribe` | Process unsubscribe request                |
| `GET`  | `/`                | Home page                                  |

## URL Formats

### Short URLs (Click Tracking)

```
https://yourdomain.com/{shortId}/{randomString1}/{randomString2}
```

**Example:**

```
https://brightsparrow.info/abc123/healthcare456def/wellness789ghi
```

### Open Tracking Pixels

```
https://yourdomain.com/content/{encrypted_campaign_offer_data}
```

**Example:**

```
https://brightsparrow.info/content/FqALJsbCDj1k-b3A4S9ZITuh-yCmyoRqZxGHSjYd1dM
```

The encrypted data contains `campaignId` and `offerId` encrypted with AES-256-CBC using base64url encoding.

## Integration with MMS

This service integrates with the main MMS system:

1. **URL Creation:** `mms-backend` calls `/url` endpoint to create short URLs
2. **Email Generation:** `monkeymediafrontend` generates tracking pixels for campaigns
3. **Analytics:** `mms-backend` reads click/open data from the database
4. **Suppression:** `mms-backend` checks the `email_list` collection before sending

## Database Collections

### `urls`

```javascript
{
  shortId: String,        // Unique short identifier
  redirectURL: String,    // Target URL
  offerId: String,        // Offer identifier
  domain: String,         // Domain used
  linkType: String,       // Link type
  campaignId: String,     // Campaign identifier
  visitHistory: [{        // Click tracking data
    timestamp: Number,
    ipAddress: String,
    userAgent: String
  }],
  clickCount: Number,     // Total clicks
  openRate: Number        // Email opens (tracking pixel hits)
}
```

### `email_list`

```javascript
{
  email: String,              // Email address (unique)
  unsubscribed_domains: [String], // Future: domain-specific unsubscribes
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features

- **Rate Limiting:** 100 requests per 10 minutes per IP+User-Agent
- **Helmet:** Security headers (XSS, CSRF, etc.)
- **CSP:** Content Security Policy with nonces
- **Honeypot:** Hidden form fields to catch bots
- **reCAPTCHA v3:** Bot protection on unsubscribe form
- **Input Validation:** Email format validation, required field checks

## Encryption Details

### AES-256-CBC Configuration

- **Algorithm:** `aes-256-cbc`
- **Key:** 32-character secret key from `SECRET_KEY` environment variable
- **IV:** Fixed zero IV (`00000000000000000000000000000000`)
- **Encoding:** Base64url (URL-safe: uses `-` and `_` instead of `+` and `/`)

### Encryption Process

1. Encrypt `campaignId=X&offerId=Y` with AES-256-CBC
2. Convert output to base64url format (no `/` or `+` characters)
3. Embed in tracking pixel URL: `/content/{base64url_data}`

## Performance Optimization

- **Caching:** 24-hour in-memory cache for frequently accessed URLs
- **Database Indexing:** Ensure indexes on `shortId`, `campaignId`, `offerId`
- **Rate Limiting:** Prevents abuse and DoS attacks
- **Connection Pooling:** Mongoose handles MongoDB connection pooling

## Error Handling

### Common HTTP Status Codes

| Code    | Scenario                                           | Response                    |
| ------- | -------------------------------------------------- | --------------------------- |
| `200` | Successful redirect or pixel serve                 | Redirect or 1×1 GIF        |
| `400` | Invalid request (missing fields, bad email format) | JSON error message          |
| `404` | Short URL not found                                | Renders `offerend.ejs`    |
| `429` | Rate limit exceeded                                | "Too many requests" message |
| `500` | Server error (DB connection, encryption failure)   | JSON error message          |

### Tracking Pixel Behavior

- **Success:** Returns 1×1 transparent GIF with `Content-Type: image/gif`
- **Decryption failure:** Still returns pixel (fire-and-forget), logs error
- **Database error:** Still returns pixel, logs error for monitoring

## Version History

- **v2.0:** Base64url encoding for tracking URLs (no more `%2F` issues)
- **v1.x:** Standard base64 + encodeURIComponent (legacy format)

## Monitoring Endpoints

### Health Check

```bash
GET /
# Returns: HTML home page (status 200 = service is running)
```

### Cache Statistics

The service uses in-memory caching but doesn't expose cache stats via API. Monitor through application logs or PM2/Docker metrics.
