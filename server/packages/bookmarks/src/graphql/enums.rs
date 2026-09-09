use async_graphql::Enum;
#[derive(Enum, Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum NovelSite {
    Qidian,
    Jjwxc,
}
impl From<NovelSite> for crate::application::NovelSite {
    fn from(v: NovelSite) -> Self {
        match v {
            NovelSite::Qidian => Self::Qidian,
            NovelSite::Jjwxc => Self::Jjwxc,
        }
    }
}
impl From<crate::application::NovelSite> for NovelSite {
    fn from(v: crate::application::NovelSite) -> Self {
        match v {
            crate::application::NovelSite::Qidian => Self::Qidian,
            crate::application::NovelSite::Jjwxc => Self::Jjwxc,
        }
    }
}

#[derive(Enum, Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum NovelStatus {
    Ongoing,
    Completed,
    Paused,
}
impl From<NovelStatus> for crate::application::NovelStatus {
    fn from(v: NovelStatus) -> Self {
        match v {
            NovelStatus::Ongoing => Self::Ongoing,
            NovelStatus::Completed => Self::Completed,
            NovelStatus::Paused => Self::Paused,
        }
    }
}
impl From<crate::application::NovelStatus> for NovelStatus {
    fn from(v: crate::application::NovelStatus) -> Self {
        match v {
            crate::application::NovelStatus::Ongoing => Self::Ongoing,
            crate::application::NovelStatus::Completed => Self::Completed,
            crate::application::NovelStatus::Paused => Self::Paused,
        }
    }
}
