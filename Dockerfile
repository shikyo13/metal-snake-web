# Use the official nginx lightweight alpine image for smaller size
FROM nginx:alpine

# Install necessary tools for potential troubleshooting
RUN apk add --no-cache bash curl

# Create directory structure
RUN mkdir -p /usr/share/nginx/html/js/config \
    /usr/share/nginx/html/js/core \
    /usr/share/nginx/html/js/systems \
    /usr/share/nginx/html/js/managers \
    /usr/share/nginx/html/js/utils \
    /usr/share/nginx/html/css \
    /usr/share/nginx/html/assets/images \
    /usr/share/nginx/html/assets/audio \
    /usr/share/nginx/html/data

# Copy the game files maintaining the directory structure
COPY index.html /usr/share/nginx/html/
COPY css/styles.css /usr/share/nginx/html/css/
COPY js/config/constants.js /usr/share/nginx/html/js/config/
COPY js/core/*.js /usr/share/nginx/html/js/core/
COPY js/systems/*.js /usr/share/nginx/html/js/systems/
COPY js/managers/*.js /usr/share/nginx/html/js/managers/
COPY js/utils/*.js /usr/share/nginx/html/js/utils/
COPY assets/images/* /usr/share/nginx/html/assets/images/
COPY assets/audio/* /usr/share/nginx/html/assets/audio/

# Create data directory with proper permissions for high scores
RUN chown -R nginx:nginx /usr/share/nginx/html/data

# Configure nginx to handle ES6 modules correctly
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location ~ \.js$ { \
        add_header Content-Type application/javascript; \
    } \
    # Enable CORS for development \
    add_header Access-Control-Allow-Origin "*"; \
    # Add security headers \
    add_header X-Content-Type-Options "nosniff"; \
    add_header X-Frame-Options "SAMEORIGIN"; \
    add_header X-XSS-Protection "1; mode=block"; \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]