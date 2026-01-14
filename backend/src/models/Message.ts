import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Message extends Model {
    public id!: string;
    public requestId!: string;
    public senderId!: string;
    public content!: string;
    public read!: boolean;
}

Message.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        requestId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        senderId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        read: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        sequelize,
        modelName: 'Message',
        updatedAt: false,
    }
);
