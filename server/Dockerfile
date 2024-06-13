# Installing dependencies:

FROM node:18.16-alpine AS install-dependencies

WORKDIR /user/src/app/server

RUN npm install -g npm@9.6.6

COPY package*.json ./

RUN npm ci

COPY . .

# Creating a build:

FROM node:18.16-alpine AS create-build

WORKDIR /user/src/app/server

RUN npm install -g npm@9.6.6

COPY --from=install-dependencies /user/src/app/server ./

RUN npm run build

USER node

# Running the application:

FROM node:18.16-alpine AS run

RUN npm install -g npm@9.6.6

WORKDIR /user/src/app/server

COPY --from=install-dependencies /user/src/app/server/node_modules ./node_modules
COPY --from=create-build /user/src/app/server/dist ./dist
COPY package.json ./

RUN npm prune --production

CMD ["npm", "run", "start:prod"]
