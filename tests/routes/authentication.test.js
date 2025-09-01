const mongoose = require("mongoose");
const app = require("../../app");
const mockingoose = require('mockingoose');
const authController = require('../../routes/auth/authentication.controller')
const UserModel = require("../../models/user");
const utils = require('../../services/utils');
const axios = require("axios").default;

require("dotenv").config();

afterAll(done => {
    mongoose.connection.close()
    done()
})

describe("GET /api/auth", () => {

    it("should return correct status for exiting users who have completed their profile", async () => {
      
      const dummyAccessTokenResponse = {data:{access_token:'212whJwdkke22jeh2w89jnsx'}};
      const dummyReq = {auth:{payload:{sub:'212whJwdkke22jeh2w89jnsx'}}}
      const dummyRes = {
        status:()=>{},
        send:()=>{}
      }

      jest.spyOn(dummyRes, 'status');
      jest.spyOn(dummyRes, 'send');
      jest.mock('../../services/utils', () => ({
        getAuthToken: () => { return Promise.resolve(dummyAccessTokenResponse)}
      }));

      let dummyUser = {
        _id: '507f191e810c19729de860ea',
        user_id: 'dwed442d2',
        email: 'name@email.com',
        complete_user_profile:{
            user_name:'baba123',
            healer_type:'babalawo'
        }
      };
  
      mockingoose(UserModel).toReturn(dummyUser, 'findOne');

      await authController.getAuth(dummyReq, dummyRes);

      expect(dummyRes.status).toHaveBeenCalledWith(200);
      expect(dummyRes.send).toHaveBeenCalledWith({status: utils.USER_PROFILE_STATUS.COMPLETE_PROFILE, user_profile:expect.anything()});
    });

    it("should return correct status for exiting users who have NOT completed their profile", async () => {
      
        const dummyAccessTokenResponse = {data:{access_token:'212whJwdkke22jeh2w89jnsx'}};
        const dummyReq = {auth:{payload:{sub:'212whJwdkke22jeh2w89jnsx'}}}
        const dummyRes = {
          status:()=>{},
          send:()=>{}
        }
  
        jest.spyOn(dummyRes, 'status');
        jest.spyOn(dummyRes, 'send');
        jest.mock('../../services/utils', () => ({
          getAuthToken: () => { return Promise.resolve(dummyAccessTokenResponse)}
        }));
  
        let dummyUser = {
          _id: '507f191e810c19729de860ea',
          user_id: 'dwed442d2',
          email: 'name@email.com',
          complete_user_profile:{}
        };
    
        mockingoose(UserModel).toReturn(dummyUser, 'findOne');
  
        await authController.getAuth(dummyReq, dummyRes);
  
        expect(dummyRes.status).toHaveBeenCalledWith(200);
        expect(dummyRes.send).toHaveBeenCalledWith({status: utils.USER_PROFILE_STATUS.INCOMPLETE_PROFILE, user_profile:expect.anything()});

      });

      it("should return get user profile information from Auth0 if user doesn't exist", async () => {
      
        const dummyAccessTokenResponse = {data:{access_token:'212whJwdkke22jeh2w89jnsx'}};
        const dummyReq = {auth:{payload:{sub:'212whJwdkke22jeh2w89jnsx'}}}
        const dummyRes = {
          status:()=>{},
          send:()=>{}
        }
  
        jest.spyOn(UserModel, 'create');
        jest.spyOn(dummyRes, 'status');
        jest.spyOn(dummyRes, 'send');
        jest.mock('../../services/utils', () => ({
          getAuthToken: () => { return Promise.resolve(dummyAccessTokenResponse)}
        }));
  
        mockingoose(UserModel).toReturn(undefined, 'findOne');

        let dummyAuth0Response = {user_id:'ud3ue2e', email: 'dummy@gmail.com'};

        jest.spyOn(axios, "request").mockReturnValue( Promise.resolve({ data: dummyAuth0Response }));

  
        await authController.getAuth(dummyReq, dummyRes);

        expect(dummyRes.status).toHaveBeenCalledWith(200);
        expect(UserModel.create).toHaveBeenCalledWith(dummyAuth0Response);
        expect(dummyRes.send).toHaveBeenCalledWith({status: utils.USER_PROFILE_STATUS.INCOMPLETE_PROFILE, user_profile:expect.anything()});

      });

  });