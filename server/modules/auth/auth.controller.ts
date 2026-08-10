import type {Request, Response} from "express";
import { authService } from "./auth.service.js";


export const authController = {

    registerReviewer: async(req: Request, res: Response)=>{
        await authService.registerReviewer(req.body);

        res.status(201).json({
            success: true, 
            message: "registration successful"
        })
    },
    
    loginReviewer: async(req: Request, res: Response)=>{
        const result = await authService.loginReviewer(req.body);

        res.status(200).json({
            success: true,
            data: result
        })
    },

    loginAdmin: async (req: Request, res: Response) => {
       const result = await authService.loginAdmin(req.body);

       res.status(200).json({
       success: true,
       data: result,
     });
   }
}