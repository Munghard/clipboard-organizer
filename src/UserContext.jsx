import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export const UserContext = createContext();

export function UserProvider({ children }) {

    // USER
    const [userName, setUserName] = useState(null);
    const [userId, setUserId] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState(null);

    const signInWithGoogle = async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/clipboard-organizer/',
            },
        });

        if (error) console.error('Login error:', error);
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Logout error:', error);
        else {
            setUserId(null);
            setUserName(null);
            setAvatarUrl(null);
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            // Fetch userid, user name and avatar from google
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) {
                console.error(error);
                return;
            }
            else {
                console.log('user was fetched successfully', user.id);
            }
            setUserName(user.user_metadata.full_name);
            setAvatarUrl(user.user_metadata.avatar_url);
            setUserId(user.id);

        }
        fetchData();
    }, []);

    return (
        <UserContext.Provider value={{
            userName, setUserName,
            userId, setUserId,
            avatarUrl, setAvatarUrl,
            signInWithGoogle, signOut
        }}>
            {children}
        </UserContext.Provider>
    )
}