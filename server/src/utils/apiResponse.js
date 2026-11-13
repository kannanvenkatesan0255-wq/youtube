/**
 * Standard API Response Structure
 * VidTube Platform
 */
class ApiResponse {
  constructor(statusCode, data = null, message = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }

  static success(data = null, message = 'Success', statusCode = 200) {
    return new ApiResponse(statusCode, data, message);
  }

  static created(data = null, message = 'Resource created successfully') {
    return new ApiResponse(201, data, message);
  }
}

module.exports = { ApiResponse };

