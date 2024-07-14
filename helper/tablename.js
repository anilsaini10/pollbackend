const USER_TABLE = "User";  
const USER_PROFILE = "Profile"; 

// ____________________________________________________________________________

const FOLLOWERS_AND_FOLLOWING_DB = "FollowersAndFollwing";  
const FOLLOWER_COLLECTION = "Follwers";  
const FOLLOWING_COLLECTION = "Following"; 

// ____________________________________________________________________________



const TRENDING_DB = "Trending"; 
const TRENDING_HASH_TAGS = "Hashtags"; 
const TRENDING_POST = "TrendingPost"; 
const TRENDING_CATEGORY = "TrendingCategory"; 


// ____________________________________________________________________________



const MESSAGES_DB = "Messages"; 


// ____________________________________________________________________________




const HOME_DB = "Home"; 
const POST_HOME_COLLECTION = "Posts"; 
const STORY_HOME_COLLECTION = "Story"; 
const LIKES_HOME_COLLECTION = "Likes"; 
const COMMENTS_HOME_COLLECTION = "Comments"; 

// ____________________________________________________________________________




const NOTIFICATION = "Notifications";  

// ____________________________________________________________________________



module.exports = {
    ACCOUNTS_DB: ACCOUNTS_DB,
    USER_TABLE: USER_TABLE,
    USER_PROFILE: USER_PROFILE,
    // ______________________________________________________________


    HOME_DB: HOME_DB,
    POST_HOME_COLLECTION: POST_HOME_COLLECTION,
    STORY_HOME_COLLECTION: STORY_HOME_COLLECTION,
    LIKES_HOME_COLLECTION: LIKES_HOME_COLLECTION,
    COMMENTS_HOME_COLLECTION: COMMENTS_HOME_COLLECTION,
    // ______________________________________________________________

    TRENDING_DB: TRENDING_DB,
    HASH_TAGS_TRENDING_COLLECTION: TRENDING_HASH_TAGS,
    POST_TRENDING_COLLECTION: TRENDING_POST,
    CATEGORY_TRENDING_COLLECTION: TRENDING_CATEGORY,
    // ______________________________________________________________
    
    MESSAGES_DB: MESSAGES_DB
    // ______________________________________________________________


}