import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

// Create the Neon client
const sql = neon(process.env.DATABASE_URL!);

// Create the Drizzle database instance
export const db = drizzle(sql);
