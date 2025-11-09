# This project ranks keyboard layouts


## Total Word Effort

It's a really janky metric. You shouldn't really be using it for anything. It works as a ballpark figure, but probably doesn't mean anything if you're comparing 650 with 660.

https://github.com/cyanophage/cyanophage.github.io/blob/main/bigram_effort.json

This is a hard coded list of all possible key pair combinations. Then for each word the pairs are summed. Then that sum is weighted by the word frequency. It is meant to take into account SFBs, LSBs, SFSs and scissors, but it's pretty arbitrary and not based on anything scientific.

> https://www.reddit.com/r/KeyboardLayouts/comments/1g895nx/comment/lwxafzu/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button