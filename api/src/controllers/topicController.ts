import { Response, Request, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { BadRequest, NotFound, Unauthenticated } from "../errors";
import {
  topicDescriptionValidator,
  topicNameValidator,
} from "../utils/validators";
import Topic from "../models/topicModel";
import { RequestWithUserInfo } from "../typings/models/user";

export const createTopic = async (
  req: RequestWithUserInfo | any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description } = req.body;
    if (!name || !description) {
      throw new BadRequest(
        "Please provide a name and description for the topic"
      );
    }

    if (!topicNameValidator(name)) {
      throw new BadRequest("Invalid input for topic name");
    }

    if (!topicDescriptionValidator(description)) {
      throw new BadRequest("Invalid input for topic description");
    }

    if (req.user?.role !== "admin") {
      throw new Unauthenticated(
        "You are not authorized to create a topic, please reach out to an admin"
      );
    }

    const topic = await Topic.create({
      name,
      description,
    });
    res.status(StatusCodes.CREATED).json({ success: true, data: topic });
  } catch (error: Error | any) {
    return next(error);
  }
};

export const getAllTopics = async (
  _: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const topics = await Topic.find();
    res
      .status(StatusCodes.OK)
      .json({ success: true, data: topics, count: topics.length });
  } catch (error: Error | any) {
    return next(error);
  }
};

export const getTopicById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    const topic = await Topic.findById(id);
    if (!topic) {
      throw new NotFound("Topic not found");
    }
    res.status(StatusCodes.OK).json({ success: true, data: topic });
  } catch (error: Error | any) {
    return next(error);
  }
};

export const updateTopicById = async (
  req: RequestWithUserInfo | any,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      user,
      params: { id: topicId },
      body: { name, description },
    } = req;

    const top = await Topic.findById(topicId);

    if (!top) {
      throw new NotFound("Topic not found");
    }

    if (user.role !== "admin") {
      throw new Unauthenticated(
        "You are not authorized to update this topic, please reach out to an admin"
      );
    }

    if (!name || !description) {
      throw new BadRequest(
        "Please provide a name and description for the topic"
      );
    }

    if (!topicNameValidator(name)) {
      throw new BadRequest("Invalid input for topic name");
    }

    if (!topicDescriptionValidator(description)) {
      throw new BadRequest("Invalid input for topic description");
    }

    const topic = await Topic.findByIdAndUpdate(
      { _id: topicId },
      { name, description },
      { new: true, runValidators: true }
    );
    if (!topic) {
      throw new NotFound("Topic not found");
    }
    res.status(StatusCodes.OK).json({ success: true, data: topic });
  } catch (error: Error | any) {
    return next(error);
  }
};

export const deleteTopicById = async (
  req: RequestWithUserInfo | any,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    if (req.user?.role !== "admin") {
      throw new Unauthenticated(
        "You are not authorized to delete this topic, please reach out to an admin"
      );
    }

    const topic = await Topic.findByIdAndDelete(id);
    if (!topic) {
      throw new NotFound("Topic not found");
    }
    res
      .status(StatusCodes.OK)
      .json({ success: true, msg: `Topic has been successfully deleted` });
  } catch (error: Error | any) {
    return next(error);
  }
};
