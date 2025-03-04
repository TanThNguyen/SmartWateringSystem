import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";




export default function SettingPage() {
  const [username, setUsername] = useState("User");
  const navigate = useNavigate();

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
