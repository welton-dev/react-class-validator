import {validate} from 'class-validator';
import {useContext, useState} from 'react';
import {ValidatorContext} from "./context";

export {ValidatorProvider, ValidatorContextOptions, OnErrorMessageHandler} from './context';

type Newable<T> = {
    new(): T;
} | Function;

type ValidationErrorMap<T, K extends keyof T> = { [key in K]?: string[] };
type ValidationPayload<T, K extends keyof T> = { [key in K]?: T[K] };
type ValidationFunction<T, K extends keyof T> = (payload: ValidationPayload<T, K>, filter?: K[]) => Promise<boolean>;
type UseValidationResult<T, K extends keyof T> = [ValidationFunction<T, K>, ValidationErrorMap<T, K>];

export const useValidation = <T, K extends keyof T>(validationClass: Newable<T>): UseValidationResult<T, K> => {

    const {onErrorMessage} = useContext(ValidatorContext);

    const [validationErrors, setErrors] = useState<ValidationErrorMap<T, K>>({});

    const validateCallback: ValidationFunction<T, K> = async (payload, filter: K[] = []) => {

        let errors = await validate(Object.assign(new (validationClass as any)(), payload));
        if (errors.length === 0) {

            setErrors({});
            return true;

        } else {

            if (filter.length > 0) {
                errors = errors.filter((err) => filter.includes(err.property as K));
            }

            const validation: ValidationErrorMap<T, K> = errors.reduce(
                (acc, value) => ({
                    ...acc,
                    [value.property as K]: onErrorMessage(value)
                }),
                {} as ValidationErrorMap<T, K>
            );

            setErrors(validation);

            if(filter.length > 0 && errors.length === 0){
                return true;
            }
            

            return false;

        }

    };

    return [validateCallback, validationErrors];

};
