import Category from "../models/categoryModel";
import { Response, Request, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { BadRequest, NotFound, Unauthenticated } from "../errors";
import { categoryValidator, topicNameValidator } from "../utils/validators";
import Topic from "../models/topicModel";
import { RequestWithUserInfo } from "../typings/models/user";
import User from "../models/userModel";

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, topic } = req.body;
    if (!name || !topic) {
      throw new BadRequest("Please provide a name and topic for the category");
    }
    if (!topicNameValidator(topic) || !categoryValidator(name)) {
      throw new BadRequest("Invalid input for category or topic");
    }
    const category = await Category.create({
      name,
      topic,
    });
    res.status(StatusCodes.CREATED).json({ success: true, data: category });
  } catch (error: Error | any) {
    return next(error);
  }
};

export const getAllCategories = async (
  _: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await Category.find();
    res
      .status(StatusCodes.OK)
      .json({ success: true, data: categories, count: categories.length });
  } catch (error: Error | any) {
    return next(error);
  }
};

export const getCategoryById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const category = await Category.findById(id);
    if (!category) {
      throw new NotFound("Category not found");
    }
    res.status(StatusCodes.OK).json({ success: true, data: category });
  } catch (error: Error | any) {
    return next(error);
  }
};

export const getCategoriesByTopic = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { topic } = req.params;
  try {
    if (!topic) {
      throw new BadRequest("Please provide a topic name");
    }

    const topicName = await Topic.findOne({
      name: { $regex: new RegExp(topic, "i") },
    }).lean();
    if (!topicName) {
      throw new NotFound("Topic not found");
    }
    const category = await Category.find({ topic: topicName._id });

    if (!category.length || category.length === 0) {
      throw new NotFound("There are no categories for this topic");
    }
    res
      .status(StatusCodes.OK)
      .json({ success: true, data: category, count: category.length });
  } catch (error: Error | any) {
    return next(error);
  }
};

export const updateCategoryById = async (
  req: RequestWithUserInfo | any,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      user: { userId },
      params: { id: categoryID },
      body: { name, topic },
    } = req;

    const cat = await Category.findById(categoryID);
    const user = await User.findById(userId);
    const topicName = await Topic.findOne({
      name: { $regex: new RegExp(topic, "i") },
    }).lean();

    if (!user) {
      throw new NotFound("User not found");
    }

    if (!cat) {
      throw new NotFound("Post not found");
    }

    if (!name || !topic) {
      throw new BadRequest("Please provide a name and topic for the category");
    }

    if (!categoryValidator(name)) {
      throw new BadRequest("Invalid input for category name");
    }

    if (!topicNameValidator(topic)) {
      throw new BadRequest("Invalid input for topic name");
    }

    if (!topicName) {
      throw new NotFound("This topic does not exist");
    }

    const isOwner = cat && cat?.postedBy?.toString() === userId;
    const isAdmin = user?.role === "admin";

    if (!isOwner && !isAdmin) {
      throw new Unauthenticated(
        "You are not authorized to update this category"
      );
    }

    const category = await Category.findByIdAndUpdate(
      categoryID,
      { name, topic: topicName?._id },
      { new: true, runValidators: true }
    );
    if (!category) {
      throw new NotFound("Category not found");
    }
    res.status(StatusCodes.OK).json({ success: true, data: category });
  } catch (error: Error | any) {
    return next(error);
  }
};

export const deleteCategoryById = async (
  req: RequestWithUserInfo | any,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const userId = req.user?.userId;
  const userRole = req.user?.role;
  try {
    const category = await Category.findById(id);
    if (!category) {
      throw new NotFound("Category not found");
    }

    const isOwner = category?.postedBy && category.postedBy.toString() === userId;
    const isAdmin = userRole === "admin";

    if (!isOwner && !isAdmin) {
      throw new Unauthenticated(
        "You are not authorized to delete this category"
      );
    }

    await Category.findByIdAndDelete(id);
    res
      .status(StatusCodes.OK)
      .json({ success: true, msg: `Category has been successfully deleted` });
  } catch (error: Error | any) {
    return next(error);
  }
};
