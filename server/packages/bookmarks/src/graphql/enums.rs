use async_graphql::Enum;
#[derive(Enum, Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum NovelSite {
    Qidian,
    Jjwxc,
}
impl From<NovelSite> for crate::model::schema::custom_type::NovelSite {
    fn from(v: NovelSite) -> Self {
        match v {
            NovelSite::Qidian => Self::Qidian,
            NovelSite::Jjwxc => Self::Jjwxc,
        }
    }
}
impl From<crate::model::schema::custom_type::NovelSite> for NovelSite {
    fn from(v: crate::model::schema::custom_type::NovelSite) -> Self {
        match v {
            crate::model::schema::custom_type::NovelSite::Qidian => Self::Qidian,
            crate::model::schema::custom_type::NovelSite::Jjwxc => Self::Jjwxc,
        }
    }
}
impl From<novel_crawler::NovelSite> for NovelSite {
    fn from(v: novel_crawler::NovelSite) -> Self {
        match v {
            novel_crawler::NovelSite::Qidian => Self::Qidian,
            novel_crawler::NovelSite::Jjwxc => Self::Jjwxc,
        }
    }
}
#[derive(Enum, Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum NovelStatus {
    Ongoing,
    Completed,
    Paused,
}
impl From<NovelStatus> for crate::model::schema::custom_type::NovelStatus {
    fn from(v: NovelStatus) -> Self {
        match v {
            NovelStatus::Ongoing => Self::Ongoing,
            NovelStatus::Completed => Self::Completed,
            NovelStatus::Paused => Self::Paused,
        }
    }
}
impl From<crate::model::schema::custom_type::NovelStatus> for NovelStatus {
    fn from(v: crate::model::schema::custom_type::NovelStatus) -> Self {
        match v {
            crate::model::schema::custom_type::NovelStatus::Ongoing => Self::Ongoing,
            crate::model::schema::custom_type::NovelStatus::Completed => Self::Completed,
            crate::model::schema::custom_type::NovelStatus::Paused => Self::Paused,
        }
    }
}
impl From<novel_crawler::NovelStatus> for NovelStatus {
    fn from(v: novel_crawler::NovelStatus) -> Self {
        match v {
            novel_crawler::NovelStatus::Ongoing => Self::Ongoing,
            novel_crawler::NovelStatus::Completed => Self::Completed,
            novel_crawler::NovelStatus::Paused => Self::Paused,
        }
    }
}
