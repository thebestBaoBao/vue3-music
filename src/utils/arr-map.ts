export const formateSongsAuthor = (attr: any[]) => {
  return attr.map(item => item.name).join(' / ');
};
export function mapSongs(songs:any[]) {
  return songs.map((item:any) => {
    const target = item.song
      ? item.song
      : item;
   
    item.dt = target.duration;
    item.al = target.album;
    item.ar = target.artists;
    item.formatAuthor = formateSongsAuthor(target.artists);
    return item;
  });
} 