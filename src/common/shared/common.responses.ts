import { Field, ObjectType } from "@nestjs/graphql";
import { Prop } from "@nestjs/mongoose";

@ObjectType()
export class NewEntryResponse{
    @Prop()
    @Field(()=>String,{nullable:true})
    message:string;

    @Prop()
    @Field(()=>String,{nullable:true})
    _id:string;

    @Prop()
    @Field(()=>String,{nullable:true})
    userId:string;

    @Prop()
    @Field(()=>Boolean,{nullable:true})
    isOk:boolean;
}

@ObjectType()
export class OrganizerInfoResponse{
    @Prop()
    @Field(()=>String,{nullable:true})
    email:string;
    
    @Prop()
    @Field(()=>String,{nullable:true})
    organizationName:string;
}