export const useRegisterSW = () => ({
  needRefresh: [false, () => {}] as [boolean, (val: boolean) => void],
  updateServiceWorker: () => Promise.resolve(),
});
