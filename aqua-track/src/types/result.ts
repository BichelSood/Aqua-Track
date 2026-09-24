export type AppError = {
  code: string;
  message: string;
};

export type AppResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: AppError;
    };
