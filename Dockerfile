FROM node:20-alpine

WORKDIR /app

# Instala bash + netcat (necessários no entrypoint)
RUN apk add --no-cache bash netcat-openbsd

# Copia pacotes e instala dependências
COPY package*.json ./
RUN npm install

# Copia todo o restante do código
COPY . .

# 6. Build da aplicação
RUN npm run build && \ 
    mkdir -p dist/migrations && \
    cp -r src/migrations/* dist/migrations/ && \
    cp ./data_source.ts dist/ 

# Expõe porta
EXPOSE $PORT

CMD ["npm", "run", "start:prod"]