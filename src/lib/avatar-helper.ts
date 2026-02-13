export const getRandomAvatar = () => {
  const maleAvatars = [
    "/assets/avatar/male/1.png",
    "/assets/avatar/male/4.png",
    "/assets/avatar/male/13.png",
    "/assets/avatar/male/34.png",
    "/assets/avatar/male/36.png",
    "/assets/avatar/male/41.png",
  ];
  
  const femaleAvatars = [
    "/assets/avatar/female/69.png",
    "/assets/avatar/female/73.png",
    "/assets/avatar/female/90.png",
    "/assets/avatar/female/91.png",
    "/assets/avatar/female/94.png",
    "/assets/avatar/female/96.png",
  ];

  // Gabungkan semua avatar
  const allAvatars = [...maleAvatars, ...femaleAvatars];

  // Ambil index random
  const randomIndex = Math.floor(Math.random() * allAvatars.length);

  return allAvatars[randomIndex];
};