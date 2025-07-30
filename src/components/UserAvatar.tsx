import React from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { User } from "next-auth";
import Image from "next/image";

type Props = {
    user: User
};

const UserAvatar = ({user}: Props) => {
    return (
        <Avatar>
        {user.image ? (
            <div className="relative w-full h-full aspect-square">
                <Image fill src={user.image} alt='user profile' referrerPolicy="no-referrer" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"/>
            </div>
        ):(
            <AvatarFallback>
                <span className="sr-only">{user.name}</span>
                <span className="text-lg">
                    {user.name?.split(" ").map((n) => n[0]).join("")}
                </span>
            </AvatarFallback>
        )}
        </Avatar>
    )
}

export default UserAvatar;