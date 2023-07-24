# MST Form Type

**Under construction**

## Install

`npm i mst-form-type -S`

## Usage

## APIs


### props

`prop`


### actions

Some actions are necessary, some are not. For normal use case, only a few actions are needed.

`set(request, reject?)`

Set the request and reject function for a mst-request. The request function will be used for later fetch action.

Every time called `set` action will reset the mst-request. See `reset()` action for more detail.

If `option()` is called to set `once = true`, the request function can only be set for one time. See `option()` action for more detail.

**Must be called before fetch to set a request function.**

