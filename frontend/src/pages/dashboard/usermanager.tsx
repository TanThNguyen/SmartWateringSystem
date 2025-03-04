import { useEffect, useState } from "react";




export default function userManagementPage() {
  const [username, setUsername] = useState("User");

  // Lấy username từ localStorage (nếu có)
  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) {
      setUsername(storedUser);
    }
  }, []);



  return (
      <div>
       
        
      </div>
    );


}
