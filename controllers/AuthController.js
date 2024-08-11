import { compare } from "bcrypt";
import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import { renameSync, unlinkSync } from "fs";

const tokenLife = 3 * 24 * 60 * 60 * 1000;

const createToken = (email, userId) => {
  return jwt.sign({ email, userId }, process.env.JWT_KEY, {
    expiresIn: tokenLife,
  });
};

export const signup = async (request, response, next) => {
  try {
    const { email, password } = request.body;
    if (!email || !password) {
      return response.status(400).send("Email and password are required");
    }
    console.log(email, password);

    const user = await User.create({ email, password });
    response.cookie("jwt", createToken(email, user.id), {
      secure: true,
      sameSite: "none",
      maxAge: tokenLife,
    });

    return response.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        profileSetup: user.profileSetup,
      },
    });
  } catch (error) {
    console.log(error);
    return response.status(500).send("Internal server error");
  }
};

export const login = async (request, response, next) => {
  try {
    const { email, password } = request.body;
    if (!email || !password) {
      return response.status(400).send("Email and password are required");
    }
    console.log(email, password);

    const user = await User.findOne({ email });
    if (!user) {
      return response.status(404).send("User not found");
    }
    const auth = await compare(password, user.password);
    if (!auth) {
      return response.status(401).send("Invalid credentials");
    }

    response.cookie("jwt", createToken(email, user.id), {
      secure: true,
      sameSite: "none",
      maxAge: tokenLife,
    });

    return response.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        image: user.image,
        color: user.color,
        profileSetup: user.profileSetup,
      },
    });
  } catch (error) {
    console.log(error);
    return response.status(500).send("Internal server error");
  }
};

export const getUserInfo = async (request, response, next) => {
  try {
    const userData = await User.findById(request.userId);
    if (!userData) {
      return response.status(404).send("User not found");
    }
    return response.status(200).json({
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      image: userData.image,
      color: userData.color,
      profileSetup: userData.profileSetup,
    });
  } catch (error) {
    console.log(error);
    return response.status(500).send("Internal server error");
  }
};

export const updateProfile = async (request, response, next) => {
  try {
    const userID = request.userId;
    const { firstName, lastName, color } = request.body;
    if (!firstName || !lastName) {
      return response
        .status(400)
        .send("Firstname, Lastname and color is required");
    }
    const userData = await User.findByIdAndUpdate(
      userID,
      { firstName, lastName, color, profileSetup: true },
      { new: true, runValidators: true }
    );

    return response.status(200).json({
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      image: userData.image,
      color: userData.color,
      profileSetup: userData.profileSetup,
    });
  } catch (error) {
    console.log(error);
    return response.status(500).send("Internal server error");
  }
};

export const addProfileImage = async (request, response, next) => {
  try {
    if(!request.file) {
      return response.status(400).send("Image is required");
    }
    const date = Date.now();
    let fileName = `uploads/profiles/${date}-${request.file.originalname}`;
    renameSync(request.file.path, fileName);
    const updatedUser = await User.findByIdAndUpdate(request.userId, { image: fileName }, { new: true, runValidators: true });

    return response.status(200).json({
      image: updatedUser.image,
    });
  } catch (error) {
    console.log(error);
    return response.status(500).send("Internal server error");
  }
};

export const removeProfileImage = async (request, response, next) => {
  try {
    const userID = request.userId;
    const user = await User.findById(userID);
    if(!user || !user.image) {
      return response.status(400).send("No image to remove");
    }

    unlinkSync(user.image);
    user.image = null;
    await user.save();

    return response.status(200).send("Profile image removed successfully");
  } catch (error) {
    console.log(error);
    return response.status(500).send("Internal server error");
  }
};
