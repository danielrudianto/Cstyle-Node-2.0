import AsyncLock from "async-lock";

const lock = new AsyncLock({
  maxExecutionTime: 15000,
});

export default lock;
