# Dockerfile backend — Express JS API
FROM node:20-alpine

WORKDIR /app

# Install dependency produksi saja (layer ini di-cache selama package.json tidak berubah)
COPY package*.json ./
RUN npm install --omit=dev

# Salin source code
COPY src ./src
COPY seed ./seed

EXPOSE 4000

CMD ["node", "src/server.js"]
