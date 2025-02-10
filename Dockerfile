# Stage 1: Build the Angular application
FROM node:16 AS build
ARG ENV

RUN echo "Environment is $ENV"
RUN echo "---------------------------------------------------"

# Set the working directory
WORKDIR /usr/local/app

# Copy the source code to the app directory
COPY ./ /usr/local/app/

# Install all the dependencies
RUN npm install

# Generate the build of the application based on environment
RUN if [ "$ENV" = "dev" ]; then npm run compile; fi
RUN if [ "$ENV" = "test" ]; then npm run compile-test; fi
RUN if [ "$ENV" = "prod" ]; then npm run compile-prod; fi
RUN if [ "$ENV" = "demo" ]; then npm run compile-demo; fi


CMD ["npm", "run", "start"]

# Expose port 3000
EXPOSE 3000
