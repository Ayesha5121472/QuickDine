
//Create a new booking
//POST /api/bookings
//@access Private
import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.js";
import { Restaurant } from "../models/Restaurant.js";
import { Booking } from "../models/Booking.js";
import restaurantRouter from "../routes/restaurantsRoutes.js";

export const createBooking=async(req: AuthRequest,res: Response) :Promise<void>=>{
    try{
        const {restaurantId, date,time,guests, occasion, specialRequests}= req.body;

        if(!restaurantId || !date || !time || !guests){
            res.status(400).json({message:"Please send all required details."});
            return;
        }

        //check if restaurant exists
        const restaurant = await Restaurant.findById(restaurantId)
        if(!restaurant){
           res.status(400).json({message: "Restaurant not found."})
           return;
        }
        
        //Verify Restaurant s approved

        if(restaurant.status !== "approved"){
         res.status(400).json({message: "Reservations are not open for this restaurant yet."})   
        }

        //Verify seat availability
        const requestedGuests=Number(guests);

        const existingBookings=await Booking.find({
            restaurant:restaurantId,
            date: new Date(date),
            time,
            status:"confirmed",
        })

        const bookedSeats= existingBookings.reduce((sum, b)=>sum +b.guests, 0)

        const totalSeats= restaurant.totalSeats || 20;

        const availableSeats = totalSeats-bookedSeats;
        if(requestedGuests > availableSeats){
            res.status(400).json({meesage: `Unable to reserve. Only ${availableSeats} seats are available for 
                this time slot.`})
             }
             const booking = await Booking.create({
                user:req.user?._id,
                date: new Date(date),
                guests: Number(guests),
                occasion,
                specialRequests,
                status: "confirmed",
             }) 

             // Populate restaurant info before returning
             const populateedBooking =await booking.populate("restaurant", " name location image address");
             res.status(201).json(populateedBooking);
    }catch(error:any){
        console.error(error);
        res.status(400).json({message: error.message})

    }


}

//Get Logged in user bookings
//GET /api/bookings/my
//@access Private

export const getMyBooking=async(req: AuthRequest,res: Response) :Promise<void>=>{
    try{
        const bookings= await Booking.find({user: req.user?._id}).populate("restaurant"
            ,"name  location image address slug").sort({date:-1, time:-1})

            res.json(bookings);


    }catch(error:any){
        console.error(error);
        res.status(400).json({message: error.message})

    }


}


//Cancel a booking
//GET /api/bookings/:id/cancel
//@access Private

export const cancelBooking=async(req: AuthRequest,res: Response) :Promise<void>=>{
    try{
        const booking = await Booking.findById(req.params.id);
        if(!booking){
            res.status(400).json({message: "Booking not found"});
            return;
        }

        //Verify user owns his booking
        if(booking.user.toString()!== req.user?._id.toString()){
            res.status(401).json({message: "Not authorized to cancel this booking"});
            return;
        }

        booking.status= "cancelled";
        await booking.save();

        const populatedBooking= await booking.populate("restaurant"
           , "name loaction image address")
           res.json(populatedBooking);
     }catch(error:any){
        console.error(error);
        res.status(400).json({message: error.message})

    }


}