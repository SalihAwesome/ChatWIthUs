import { User } from './User';
import { SupportRequest } from './Request';
import { Message } from './Message';

User.hasMany(SupportRequest, { foreignKey: 'guestId', as: 'createdRequests' });
SupportRequest.belongsTo(User, { foreignKey: 'guestId', as: 'guest' });

SupportRequest.hasMany(Message, { foreignKey: 'requestId', as: 'messages' });
Message.belongsTo(SupportRequest, { foreignKey: 'requestId', as: 'request' });

User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

export { User, SupportRequest, Message };
