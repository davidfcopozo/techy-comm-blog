import dns from "dns";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Topic from "../models/topicModel";
import Category from "../models/categoryModel";
import User from "../models/userModel";
import {
  categoryValidator,
  sanitizeSlug,
  slugValidator,
  topicDescriptionValidator,
  topicNameValidator,
} from "../utils/validators";

// Use public DNS for MongoDB SRV resolution
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore if not supported
}

dotenv.config();

const MONGO_DB = (process.env.MONGO_DB || process.env.MONGODB_URI) as string;

interface TopicSeedData {
  name: string;
  description: string;
  categories: string[];
}

const SEED_DATA: TopicSeedData[] = [
  {
    name: "Programming Languages",
    description: "In-depth features language paradigms and runtime deep dives",
    categories: [
      "JavaScript",
      "TypeScript",
      "Python",
      "Go",
      "Rust",
      "Java",
      "C#",
      "C++",
      "PHP",
      "Ruby",
      "Swift",
      "Kotlin",
      "SQL",
      "HTML",
      "CSS",
      "Bash",
      "Scala",
      "Elixir",
      "Dart",
      "Lua",
    ],
  },
  {
    name: "Frontend Frameworks",
    description: "Modern client side libraries reactive frameworks and UI toolkits",
    categories: [
      "React",
      "Next.js",
      "Vue.js",
      "Nuxt.js",
      "Angular",
      "Svelte",
      "SvelteKit",
      "Remix",
      "Astro",
      "SolidJS",
      "Tailwind CSS",
      "Redux",
      "TanStack Query",
      "Vite",
      "Webpack",
      "Frontend Development",
      "Web Performance",
      "Accessibility",
    ],
  },
  {
    name: "Backend Frameworks",
    description: "Server side application frameworks API development and runtimes",
    categories: [
      "Node.js",
      "Express.js",
      "NestJS",
      "Fastify",
      "Django",
      "Flask",
      "FastAPI",
      "Spring Boot",
      "ASP.NET Core",
      "Laravel",
      "Ruby on Rails",
      "Gin",
      "Fiber",
      "Actix Web",
      "Backend Development",
      "Full Stack",
    ],
  },
  {
    name: "Cloud and Services",
    description: "Cloud service providers hosting platforms and serverless solutions",
    categories: [
      "AWS",
      "Amazon Web Services",
      "Google Cloud Platform",
      "Microsoft Azure",
      "Vercel",
      "Netlify",
      "Cloudflare",
      "Firebase",
      "Supabase",
      "Render",
      "Heroku",
      "DigitalOcean",
      "Serverless",
    ],
  },
  {
    name: "Software Architecture",
    description: "System design patterns microservices and architectural principles",
    categories: [
      "Software Architecture",
      "System Design",
      "Microservices",
      "Monolithic Architecture",
      "Serverless Architecture",
      "Event Driven Architecture",
      "Clean Architecture",
      "Domain Driven Design",
      "REST API",
      "GraphQL",
      "gRPC",
      "WebSockets",
      "Design Patterns",
      "MVC Architecture",
    ],
  },
  {
    name: "DevOps and Infrastructure",
    description: "Containerization continuous deployment and infrastructure automation",
    categories: [
      "DevOps",
      "Docker",
      "Kubernetes",
      "CI/CD",
      "GitHub Actions",
      "Terraform",
      "Ansible",
      "Helm",
      "Prometheus",
      "Grafana",
      "Linux",
      "Nginx",
    ],
  },
  {
    name: "Databases and Storage",
    description: "Relational document key-value databases and caching solutions",
    categories: [
      "Databases",
      "PostgreSQL",
      "MySQL",
      "MongoDB",
      "Redis",
      "SQLite",
      "Elasticsearch",
      "Cassandra",
      "DynamoDB",
      "Prisma",
      "Mongoose",
    ],
  },
  {
    name: "AI and Machine Learning",
    description: "Machine learning artificial intelligence neural networks and LLMs",
    categories: [
      "Artificial Intelligence",
      "Machine Learning",
      "Deep Learning",
      "Natural Language Processing",
      "Computer Vision",
      "Large Language Models",
      "Data Science",
      "Data Engineering",
    ],
  },
  {
    name: "Mobile and Cross-Platform",
    description: "Native and cross platform mobile application development",
    categories: [
      "Mobile Development",
      "React Native",
      "Flutter",
      "iOS Development",
      "Android Development",
      "Expo",
      "SwiftUI",
      "Jetpack Compose",
    ],
  },
  {
    name: "Testing and Quality",
    description: "Automated software testing test driven development and reliability",
    categories: [
      "Testing and QA",
      "Unit Testing",
      "Integration Testing",
      "End to End Testing",
      "Jest",
      "Cypress",
      "Playwright",
      "Vitest",
      "Test Driven Development",
    ],
  },
  {
    name: "Security and Practices",
    description: "Application security cryptography identity and tech careers",
    categories: [
      "Cybersecurity",
      "Web Security",
      "Authentication",
      "OAuth",
      "Best Practices",
      "Code Quality",
      "Career in Tech",
    ],
  },
];

async function seed() {
  if (!MONGO_DB) {
    console.error("MONGO_DB environment variable is missing.");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_DB);
  console.log("Connected to MongoDB successfully.");

  // Find an existing user to associate as postedBy
  let defaultUser = await User.findOne({ role: "admin" });
  if (!defaultUser) {
    defaultUser = await User.findOne();
  }

  if (!defaultUser) {
    console.error("No user found in database to assign as postedBy.");
    process.exit(1);
  }

  console.log(`Using user "${defaultUser.email}" (${defaultUser._id}) as author.`);

  let createdCategoriesCount = 0;
  let existingCategoriesCount = 0;

  for (const topicData of SEED_DATA) {
    if (!topicNameValidator(topicData.name)) {
      throw new Error(`Invalid topic name: ${topicData.name}`);
    }
    if (!topicDescriptionValidator(topicData.description)) {
      throw new Error(`Invalid topic description: ${topicData.description}`);
    }

    // Upsert topic
    let topic = await Topic.findOne({ name: topicData.name });
    if (!topic) {
      topic = await Topic.create({
        name: topicData.name,
        description: topicData.description,
        postedBy: defaultUser._id,
      });
      console.log(`Created Topic: "${topic.name}"`);
    } else {
      console.log(`Topic exists: "${topic.name}"`);
    }

    for (const catName of topicData.categories) {
      if (!categoryValidator(catName)) {
        throw new Error(`Invalid category name: "${catName}"`);
      }

      const slug = sanitizeSlug(catName);
      if (!slugValidator(slug)) {
        throw new Error(`Invalid category slug: "${slug}" for "${catName}"`);
      }

      const existingCategory = await Category.findOne({
        $or: [{ name: catName }, { slug }],
      });
      if (!existingCategory) {
        await Category.create({
          name: catName,
          slug,
          topic: topic._id,
          postedBy: defaultUser._id,
          usageCount: 0,
        });
        createdCategoriesCount++;
        console.log(`  -> Created Category: "${catName}" (${slug})`);
      } else {
        existingCategoriesCount++;
      }
    }
  }

  const totalCategories = await Category.countDocuments();
  const totalTopics = await Topic.countDocuments();
  console.log(
    `\nDone! Created ${createdCategoriesCount} new categories (${existingCategoriesCount} already existed). Total topics: ${totalTopics}, Total categories: ${totalCategories}`
  );
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Error seeding categories:", err);
  process.exit(1);
});
