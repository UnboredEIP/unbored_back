const dbNames = ["unbored", "unboredProfileEnv", "unboredGroupEnv", "unboredEventEnv", "unboredEventsEnv", "unboredAuthEnv", "unboredFriendsEnv"]

for (let key in dbNames) {
    db = db.getSiblingDB(dbNames[key]);
    db.createUser(
        {
            user: "unboredUser",
            pwd: process.env.MONGO_USER_PASSWORD,
            roles: [
                { role: "readWrite", db: dbNames[key] }
            ]
        },
    );
}