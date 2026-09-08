import { timeStamp } from 'console';
import {Document,model,Schema} from 'mongoose'
export interface IUser extends Document{
    name : string;
    email: string;
    password:string;
    phone?:string;
    role: "user" | "admin" | "owner";
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
   { 
    name: {type:String, required:true,trim:true},
    email: {type:String, required:true, unique:true, trim:true, lowercase: true},
    password: {type:String, required:true, minlerngth:6},
    phone: {type:String, trim:true},
    role: {type:String, enum:["user", "admin", "owner"], default:"user"},
    createdAt: {type:Date, default:Date.now},
    updatedAt: {type:Date, default:Date.now}
},

{timestamps:true},
)

//Remove passwoprd when we convert to json
UserSchema.set("toJSON", {
    transform: (doc, ret)=> {
        delete ret.password;
        return ret;
    }
})

export const User = model<IUser>("User", UserSchema)