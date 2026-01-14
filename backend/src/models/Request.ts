import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export class SupportRequest extends Model {
    public id!: string;
    public guestId!: string;
    public email!: string;
    public issue!: string;
    public description!: string;
    public priority!: string;
    public status!: string;
    public category!: string;
    public assignedAgent!: string | null;
    public resolvedAt!: Date | null;
}

SupportRequest.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        guestId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        issue: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        priority: {
            type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
            defaultValue: 'MEDIUM',
        },
        status: {
            type: DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'),
            defaultValue: 'PENDING',
        },
        category: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        assignedAgent: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        resolvedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'SupportRequest',
        tableName: 'Requests',
    }
);
