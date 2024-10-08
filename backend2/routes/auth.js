const express = require("express");
const Voter = require("../Models/Voter");
const Candidate = require("../Models/Candidate");
const router = express.Router();
const bcrypt = require('bcryptjs');

// Signup route
router.post("/signup", async (req, res) => {
  let { name, username, email, contact, aadharCardNumber, password, role } =
    req.body;

  try { 
    const saltpass = await bcrypt.genSalt(10);
    const hashpass = await bcrypt.hash(password, saltpass);
    console.log("hashpass",hashpass,password);
    if (role === "voter") {
      const newVoter = new Voter({
        name,
        username,
        email,
        contact,
        aadharCardNumber,
        password:hashpass,
      });
      await newVoter.save();
      return res.status(201).json({ message: "Voter registered successfully" });
    } else if (role === "candidate") {
      const newCandidate = new Candidate({
        name,
        username,
        email,
        contact,
        aadharCardNumber,
        password:hashpass,
      });
      await newCandidate.save();
      return res
        .status(201)
        .json({ message: "Candidate registered successfully" });
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  let { aadharCardNumber, password, role } = req.body;

  try {
    let user;
    if (role === "voter") {
      user = await Voter.findOne({ aadharCardNumber });
    } else if (role === "candidate") {
      user = await Candidate.findOne({ aadharCardNumber });
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User found:", user.password,password);

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Compare result:", isMatch);
    if (!isMatch) {
      return res.status(401).json({ message: "Wrong Pass" });
    }
    console.log("User Found");
    return res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        contact: user.contact,
        role: user.role,
        aadharCardNumber: user.aadharCardNumber
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});
router.put('/change-password', async (req, res) => {
  try {
    const { aadharCardNumber, currentPassword, newPassword } = req.body;

    console.log('Received change password request for Aadhar:', aadharCardNumber);

    // Find the user
    let user = await Voter.findOne({ aadharCardNumber });
    if (!user) {
      user = await Candidate.findOne({ aadharCardNumber });
    }
    
    if (!user) {
      console.log('User not found for Aadhar:', aadharCardNumber);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found:', user.username);

    // Check if the current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      console.log('Current password is incorrect for user:', currentPassword," ",isMatch);
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    console.log('Current password verified for user:', user.username);

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();
    console.log('Password updated successfully for user:', user.username);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Detailed error in change-password route:', error);
    res.status(500).json({ message: 'Server error', error: error.toString() });
  }
});



module.exports = router;
