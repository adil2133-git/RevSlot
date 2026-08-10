import bcrypt from "bcryptjs";
import {db} from "../config/db.js";
import { admins } from "../db/schema/admins.js";

const seed = async()=>{
    const passwordHash = await bcrypt.hash("admin@123",10);

    await db.insert(admins).values({
        name: "Test Admin",
        email: "admin@test.com",
        passwordHash
    }).onConflictDoNothing({
        target: admins.email
    });
    
    console.log("seed successfully created admins data")
}

seed().catch((error)=>{
    console.log("seed failed", error)
    process.exit(1)
})