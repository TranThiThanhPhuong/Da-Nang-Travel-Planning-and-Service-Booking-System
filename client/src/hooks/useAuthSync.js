import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import api from "./axios";

export const useAuthSync = () => {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { getToken } = useAuth();
  const [dbUser, setDbUser] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sync = async () => {
      if (isLoaded && isSignedIn && clerkUser) {
        try {
          const response = await api.post("/api/auth/sync", { clerkId: clerkUser.id });
          
          if (response.data.success) {
            setDbUser(response.data.data); 
          }
        } catch (error) {
          console.error("Lỗi đồng bộ user:", error);
        } finally {
          setIsLoading(false);
        }
      } else if (isLoaded && !isSignedIn) {
        setDbUser(null);
        setIsLoading(false);
      }
    };

    sync();
  }, [isLoaded, isSignedIn, clerkUser]);

  return { dbUser, isLoading, isSignedIn };
};