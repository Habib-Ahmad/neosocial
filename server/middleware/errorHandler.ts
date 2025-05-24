import { NextFunction, Request, Response } from "express";
import { constants } from "../utils/constants";

const errorHandler =
  (includeStackTrace: boolean = true) =>
  (err: Error, req: Request, res: Response, next: NextFunction) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    const responseObj: any = {
      title: "",
      status: statusCode,
      message: err.message,
    };

    if (includeStackTrace) {
      responseObj.stackTrace = err.stack;
    }

    switch (statusCode) {
      case constants.BAD_REQUEST:
        responseObj.title = "Bad Request";
        break;

      case constants.NOT_FOUND:
        responseObj.title = "Not Found";
        break;

      case constants.UNAUTHORIZED:
        responseObj.title = "Unauthorized";
        break;

      case constants.FORBIDDEN:
        responseObj.title = "Forbidden";
        break;

      case constants.SERVER_ERROR:
        responseObj.title = "Server Error";
        break;

      default:
        break;
    }

    res.json(responseObj);
  };

export default errorHandler;
