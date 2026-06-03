
/**
 * Generic Response Data Transfer Object
 * @author 129891 - Renato Vinicius
 * @date setembro 2025
 */
export class ResponseDto<T> {
  statusCode: number;  // HTTP Status Code
  message: string;     // Response Message
  path: string;        // Request Path
  timestamp: string;   // ISO String
  data?: T;            // Generic Data Payload
}
