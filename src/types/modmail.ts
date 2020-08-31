type Conversation = {
    ConversationID: number;
    Active: boolean;
    User: {
        username: string;
        userID: string;
    }
    Meta: {
        GuildName: string;
        CategoryName: string;
        CategoryID: string;
        ChannelName: string;
        ChannelID: string;
    }
    LastUpdatedAt: string;
    CreatedAt: string;
    ClosingDate: null | string;
};

type ConversationMessage = {
    MessageID: number;
    Author: {
        Mod: boolean;
        Name: string;
        ID: string;
    }
    Message: {
        Internal: boolean;
        Content: string;
        Deleted: boolean;
    };
    attachment: string | null;
    CreatedAt: string;
}
