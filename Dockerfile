FROM node:20-slim
WORKDIR /app
COPY package*.json ./
# Install all dependencies (including devDependencies like Vite to run the build)
RUN npm install
COPY . .
# Compile the React frontend directly inside the Docker container
RUN npm run build
# Prune devDependencies to keep the container small and fast
RUN npm prune --production
ENV PORT=8080
EXPOSE 8080
CMD ["npm", "start"]
