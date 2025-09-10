const axios = require("axios");

async function testAPI() {
  try {
    // Test login first
    const loginResponse = await axios.post(
      "http://localhost:5000/api/admin/auth/login",
      {
        username: "admin",
        password: "admin123",
      }
    );

    const token = loginResponse.data.token;
    console.log("Login successful, token:", token.substring(0, 20) + "...");

    // Test get doctors with specialty populated
    const doctorsResponse = await axios.get(
      "http://localhost:5000/api/admin/users/role/doctor",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("Doctors data:");
    console.log(JSON.stringify(doctorsResponse.data.slice(0, 2), null, 2));
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

testAPI();
